const AudioService = require("../services/AudioService");
const fileUploadService = require("../util/s3");

// Library tracks and covers live in their own public folder.
const AUDIO_FOLDER = "media/audio";
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/x-m4a",
  "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm",
];

module.exports = () => {
  const list = async (req, res, next) => {
    console.log("AudioController => list");
    const { search, sort } = req.query;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const data = await AudioService().list({ search, sort, page, limit });

    req.rData = data;
    req.msg = "success";
    next();
  };

  /** GET /public/audio/:audioId - one sound, with its reel count. */
  const detail = async (req, res, next) => {
    console.log("AudioController => detail");
    const { audioId } = req.params;

    const audio = await AudioService().fetch(audioId);

    if (!audio) {
      req.rCode = 5;
      req.msg = "audio_not_found";
      return next();
    }

    req.rData = audio;
    req.msg = "success";
    next();
  };

  /** GET /public/audio/:audioId/reels - every reel made with this sound. */
  const reelsUsing = async (req, res, next) => {
    console.log("AudioController => reelsUsing");
    const { audioId } = req.params;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    req.rData = await AudioService().getReelsUsing(audioId, { page, limit });
    req.msg = "success";
    next();
  };

  /** GET /user/audio/original - sounds this user created from their reels. */
  const myOriginalSounds = async (req, res, next) => {
    console.log("AudioController => myOriginalSounds");
    const { userId } = req.body;

    req.rData = await AudioService().getOriginalSoundsByUser(userId);
    req.msg = "success";
    next();
  };

  const saveToggle = async (req, res, next) => {
    console.log("AudioController => saveToggle");
    const { userId } = req.body;
    const { audioId } = req.params;

    const data = await AudioService().toggleSave(audioId, userId);

    if (!data) {
      req.rCode = 5;
      req.msg = "audio_not_found";
      return next();
    }

    req.rData = data;
    req.msg = "success";
    next();
  };

  const getSaved = async (req, res, next) => {
    console.log("AudioController => getSaved");
    const { userId } = req.body;

    const data = await AudioService().getSaved(userId);

    req.rData = data;
    req.msg = "success";
    next();
  };

  const create = async (req, res, next) => {
    console.log("AudioController => create");
    let { title, artist, duration } = req.body;

    if (!req.files || !req.files.audio) {
      req.rCode = 0;
      req.msg = "audio_file_required";
      return next();
    }

    const audioFile = Array.isArray(req.files.audio)
      ? req.files.audio[0]
      : req.files.audio;

    if (!ALLOWED_AUDIO_TYPES.includes(String(audioFile.mimetype).toLowerCase())) {
      req.rCode = 0;
      req.msg = "audio_file_invalid";
      return next();
    }

    const uploadRes = await fileUploadService.uploadFileToAws(audioFile, {
      folder: AUDIO_FOLDER,
    });
    const url = uploadRes.images[0];

    let coverImage = "";
    if (req.files.coverImage) {
      const coverUpload = await fileUploadService.uploadFileToAws(
        req.files.coverImage,
        { folder: AUDIO_FOLDER },
      );
      coverImage = coverUpload.images[0];
    }

    const audio = await AudioService().addAudio({
      title,
      artist,
      duration,
      url,
      coverImage,
    });

    req.rData = audio;
    req.msg = "audio_created";
    next();
  };

  const update = async (req, res, next) => {
    console.log("AudioController => update");
    const { id } = req.params;

    await AudioService().updateAudio(id, req.body);

    req.msg = "success";
    next();
  };

  const remove = async (req, res, next) => {
    console.log("AudioController => remove");
    const { id } = req.params;

    await AudioService().deleteAudio(id);

    req.msg = "audio_deleted";
    next();
  };

  return {
    list,
    detail,
    reelsUsing,
    myOriginalSounds,
    saveToggle,
    getSaved,
    create,
    update,
    delete: remove,
  };
};
