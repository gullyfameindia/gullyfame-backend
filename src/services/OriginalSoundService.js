// "Original sound" - when someone publishes a reel that isn't using a track
// from the library, its own audio becomes a sound other users can record over,
// the way Instagram and Moj do it.
//
// The audio is pulled out of the video into its own small .m4a rather than
// pointing at the 6MB video file, so the editor downloads only what it needs
// and the sound survives the original reel being deleted.
//
// Requires the `ffmpeg` binary on PATH (already needed by ExportService).
// Extraction runs in the background: publishing never waits for it, and a
// failure here leaves the reel published and simply without an original sound.
const { execFile } = require("child_process");
const fs = require("fs");
const fsp = fs.promises;
const os = require("os");
const path = require("path");
const Audio = require("../models/Audio");
const Reel = require("../models/Reel");
const User = require("../models/User");
const fileUploadService = require("../util/s3");

const AUDIO_FOLDER = "media/audio";
// Reels are short; anything longer is almost certainly not a reel.
const MAX_SECONDS = parseInt(process.env.ORIGINAL_SOUND_MAX_SECONDS) || 180;

let ffmpegChecked = false;
let ffmpegOk = false;

const checkFfmpeg = () =>
  new Promise((resolve) => {
    if (ffmpegChecked) return resolve(ffmpegOk);
    execFile("ffmpeg", ["-version"], (err) => {
      ffmpegChecked = true;
      ffmpegOk = !err;
      resolve(ffmpegOk);
    });
  });

const run = (bin, args) =>
  new Promise((resolve, reject) => {
    execFile(bin, args, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr?.slice(-400) || err.message));
      resolve(stdout);
    });
  });

const downloadToFile = async (url, destPath) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`failed_to_download_${response.status}`);
  await fsp.writeFile(destPath, Buffer.from(await response.arrayBuffer()));
};

// ffprobe ships with ffmpeg; falls back to 0 so a missing duration is not fatal.
const probeDuration = async (filePath) => {
  try {
    const out = await run("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const seconds = Math.round(parseFloat(out));
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  } catch (ex) {
    console.log("OriginalSoundService => probeDuration failed", ex.message);
    return 0;
  }
};

// "Original sound - @alia" / "Original sound - Alia"
const soundTitleFor = (user) => {
  const handle =
    (user && (user.username || [user.firstName, user.lastName].filter(Boolean).join(" "))) ||
    "";
  return handle ? `Original sound - ${handle}` : "Original sound";
};

/**
 * Pull the audio out of a published reel and save it as a reusable sound.
 * Returns the Audio document, or null when there is nothing to make
 * (no video, already has one, no audio track, ffmpeg missing, too long).
 * Never throws: the reel is already published by the time this runs.
 */
const createFromReel = async (reelId) => {
  let workDir;
  try {
    const reel = await Reel.findOne({
      _id: reelId,
      isDeleted: { $ne: true },
      status: "published",
    }).lean();

    if (!reel || !reel.video_url) return null;

    // A reel using a library track already has its music; don't duplicate it.
    if (reel.music && reel.music.id) return null;

    // Don't make a second sound for the same reel (re-publish, edit, retry).
    const existing = await Audio.findOne({ sourceReel: reel._id }).lean();
    if (existing) return null;

    if (!(await checkFfmpeg())) {
      console.log("OriginalSoundService => ffmpeg not available, skipping");
      return null;
    }

    workDir = await fsp.mkdtemp(path.join(os.tmpdir(), "gf-sound-"));
    const inputPath = path.join(workDir, "input.mp4");
    const outputPath = path.join(workDir, "sound.m4a");

    await downloadToFile(reel.video_url, inputPath);

    const duration = await probeDuration(inputPath);
    if (duration > MAX_SECONDS) {
      console.log("OriginalSoundService => clip too long, skipping", duration);
      return null;
    }

    // -vn drops the video; fails if the clip has no audio track at all.
    await run("ffmpeg", [
      "-y", "-i", inputPath,
      "-vn", "-c:a", "aac", "-b:a", "128k",
      outputPath,
    ]);

    const { size } = await fsp.stat(outputPath);
    if (!size) return null;

    const uploadRes = await fileUploadService.uploadFileToAws(
      {
        name: `${reel._id}_sound.m4a`,
        mimetype: "audio/mp4",
        data: await fsp.readFile(outputPath),
      },
      { folder: AUDIO_FOLDER },
    );

    const author = await User.findById(reel.author)
      .select("username firstName lastName")
      .lean();

    const audio = await Audio.create({
      title: soundTitleFor(author),
      artist: (author && author.username) || "",
      url: uploadRes.images[0],
      coverImage: reel.thumbnail_url || "",
      duration: duration || 0,
      isOriginalSound: true,
      sourceReel: reel._id,
      createdByUser: reel.author,
      usageCount: 1,
    });

    // Point the reel at its own sound, so the feed shows and plays it.
    await Reel.updateOne(
      { _id: reel._id },
      { music: { id: String(audio._id), name: audio.title } },
    );

    console.log("OriginalSoundService => created sound", String(audio._id));
    return audio;
  } catch (ex) {
    console.log("OriginalSoundService => createFromReel failed", ex.message);
    return null;
  } finally {
    if (workDir) await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
};

/** Kick extraction off without making the caller wait for it. */
const createFromReelInBackground = (reelId) => {
  setImmediate(() => {
    createFromReel(reelId).catch((e) =>
      console.log("OriginalSoundService => background error", e.message),
    );
  });
};

/**
 * Called when a reel is deleted.
 * If nobody else has used its original sound, the sound and its file go too.
 * If other people are using it, the sound stays so their reels keep working,
 * and it is simply detached from the deleted reel.
 * Returns { removed, keptInUse, fileUrl } - fileUrl is set only when removed.
 */
const handleSourceReelDeleted = async (reelId) => {
  try {
    const audio = await Audio.findOne({ sourceReel: reelId, isOriginalSound: true });
    if (!audio) return { removed: false, keptInUse: false, fileUrl: "" };

    const otherUsers = await Reel.countDocuments({
      "music.id": String(audio._id),
      _id: { $ne: reelId },
      isDeleted: { $ne: true },
    });

    if (otherUsers > 0) {
      audio.sourceReel = null;
      await audio.save();
      return { removed: false, keptInUse: true, fileUrl: "" };
    }

    const fileUrl = audio.url;
    await Audio.deleteOne({ _id: audio._id });
    return { removed: true, keptInUse: false, fileUrl };
  } catch (ex) {
    console.log("OriginalSoundService => handleSourceReelDeleted failed", ex.message);
    return { removed: false, keptInUse: false, fileUrl: "" };
  }
};

module.exports = {
  createFromReel,
  createFromReelInBackground,
  handleSourceReelDeleted,
};
