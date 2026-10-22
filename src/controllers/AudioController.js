const AudioService = require("../services/AudioService");
const fileUploadService = require("../util/s3");

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

    const uploadRes = await fileUploadService.uploadFileToAws(
      req.files.audio,
    );
    const url = uploadRes.images[0];

    let coverImage = "";
    if (req.files.coverImage) {
      const coverUpload = await fileUploadService.uploadFileToAws(
        req.files.coverImage,
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

  return { list, saveToggle, getSaved, create, update, delete: remove };
};
