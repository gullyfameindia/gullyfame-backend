// Server-side render fallback for the editor's "Export Failed — can't convert
// .mp4 to Kotlin type" bug. Instead of relying on the on-device Media3/Kotlin
// video composer for every edit, the client can hand the raw clip + editState
// to this pipeline and poll for a finished .mp4.
//
// Requires the `ffmpeg` binary on PATH. Composition scope, by design, covers
// the two things a device-side composer most commonly chokes on:
//   - color adjustments (brightness/contrast/highlights/shadows)
//   - mixing a separate voice-over track into the clip's audio
// Text overlays are applied too, IF FFMPEG_FONT_PATH is configured (drawtext
// needs a font file on servers without fontconfig). Sticker/image overlays
// are intentionally not composited server-side yet — they still round-trip
// through editState for the client to render itself.
const { execFile } = require("child_process");
const fs = require("fs");
const fsp = fs.promises;
const os = require("os");
const path = require("path");
const Reel = require("../models/Reel");
const fileUploadService = require("../util/s3");

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

const downloadToFile = async (url, destPath) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed_to_download_${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fsp.writeFile(destPath, buffer);
};

const buildEqFilter = (adjustments = {}) => {
  const { brightness = 0, contrast = 0, highlights = 0, shadows = 0 } =
    adjustments;

  // Sliders are -100..100 in the UI; map to ffmpeg's eq= ranges.
  const b = (brightness / 200).toFixed(3); // -0.5..0.5
  const c = (1 + contrast / 100).toFixed(3); // 0..2
  const gamma = (1 - shadows / 200).toFixed(3); // shadows lift/crush midtones
  const gammaWeight = Math.min(1, Math.max(0, 1 + highlights / 200)).toFixed(3);

  return `eq=brightness=${b}:contrast=${c}:gamma=${gamma}:gamma_weight=${gammaWeight}`;
};

const escapeDrawtext = (text) =>
  String(text || "").replace(/([:'\\])/g, "\\$1");

const buildOverlayFilters = (overlays = []) => {
  const fontPath = process.env.FFMPEG_FONT_PATH;
  if (!fontPath || !overlays.length) return [];

  return overlays
    .filter((o) => o.type === "text" && o.text)
    .map((o) => {
      const start = ((o.startMs || 0) / 1000).toFixed(2);
      const end = ((o.endMs || 0) / 1000 || 999999).toFixed(2);
      return (
        `drawtext=fontfile=${fontPath}:text='${escapeDrawtext(o.text)}':` +
        `x=${o.x || 0}:y=${o.y || 0}:fontsize=32:fontcolor=white:` +
        `enable='between(t,${start},${end})'`
      );
    });
};

const setStatus = (reelId, fields) =>
  Reel.updateOne({ _id: reelId }, fields).catch((e) =>
    console.log("ExportService => setStatus error", e.message),
  );

// Kicked off fire-and-forget by the controller; the client polls
// GET /reels/:reelId/export/status for the result.
const runExport = async (reelId) => {
  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    await setStatus(reelId, {
      exportStatus: "failed",
      exportError: "ffmpeg_not_installed",
    });
    return;
  }

  const reel = await Reel.findById(reelId);
  if (!reel || !reel.video_url) {
    await setStatus(reelId, {
      exportStatus: "failed",
      exportError: "reel_not_exportable",
    });
    return;
  }

  const workDir = await fsp.mkdtemp(path.join(os.tmpdir(), "gf-export-"));
  const inputPath = path.join(workDir, "input.mp4");
  const outputPath = path.join(workDir, "output.mp4");
  const voicePath = path.join(workDir, "voice.m4a");

  try {
    await downloadToFile(reel.video_url, inputPath);

    const videoFilters = [buildEqFilter(reel.editState?.adjustments)]
      .concat(buildOverlayFilters(reel.editState?.overlays))
      .join(",");

    const args = ["-y", "-i", inputPath];
    const hasVoiceOver = !!reel.voiceOver?.url;

    if (hasVoiceOver) {
      await downloadToFile(reel.voiceOver.url, voicePath);
      args.push("-i", voicePath);
      args.push(
        "-filter_complex",
        `[0:v]${videoFilters}[v];[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0[a]`,
        "-map",
        "[v]",
        "-map",
        "[a]",
      );
    } else {
      args.push("-vf", videoFilters);
    }

    args.push("-c:v", "libx264", "-c:a", "aac", "-preset", "veryfast", outputPath);

    await new Promise((resolve, reject) => {
      execFile("ffmpeg", args, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr?.slice(-500) || err.message));
        resolve();
      });
    });

    const outputBuffer = await fsp.readFile(outputPath);
    const uploadRes = await fileUploadService.uploadFileToAws({
      name: `${reelId}_export.mp4`,
      mimetype: "video/mp4",
      data: outputBuffer,
    });

    await setStatus(reelId, {
      video_url: uploadRes.images[0],
      exportStatus: "ready",
      exportError: "",
      exportedAt: new Date(),
    });
  } catch (ex) {
    console.log("ExportService => runExport failed", ex.message);
    await setStatus(reelId, {
      exportStatus: "failed",
      exportError: ex.message.slice(0, 500),
    });
  } finally {
    await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
};

const startExport = async (reelId, userId) => {
  const reel = await Reel.findOne({ _id: reelId, author: userId });
  if (!reel) throw new Error("reel_not_found");
  if (!reel.video_url) throw new Error("reel_not_exportable");

  reel.exportStatus = "processing";
  reel.exportError = "";
  await reel.save();

  // Fire-and-forget: caller polls getStatus() for completion.
  setImmediate(() => runExport(reelId));

  return { reelId, exportStatus: "processing" };
};

const getStatus = async (reelId, userId) => {
  const reel = await Reel.findOne({ _id: reelId, author: userId })
    .select("exportStatus exportError exportedAt video_url")
    .lean();
  if (!reel) return null;
  return reel;
};

module.exports = { startExport, getStatus };
