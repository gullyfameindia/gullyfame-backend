const SoundFxService = require("../services/SoundFxService");
const fileUploadService = require("../util/s3");

module.exports = () => {
  const list = async (req, res, next) => {
    console.log("SoundFxController => list");
    const soundFx = await SoundFxService().list();

    req.rData = soundFx;
    req.msg = "success";
    next();
  };

  const create = async (req, res, next) => {
    console.log("SoundFxController => create");
    const { name, category, duration } = req.body;

    if (!req.files || !req.files.audio) {
      req.rCode = 0;
      req.msg = "soundfx_audio_required";
      return next();
    }

    const uploadRes = await fileUploadService.uploadFileToAws(req.files.audio);
    const url = uploadRes.images[0];

    const soundFx = await SoundFxService().addSoundFx({
      name,
      category,
      duration,
      url,
    });

    req.rData = soundFx;
    req.msg = "soundfx_created";
    next();
  };

  const update = async (req, res, next) => {
    console.log("SoundFxController => update");
    const { id } = req.params;

    await SoundFxService().updateSoundFx(id, req.body);

    req.msg = "success";
    next();
  };

  const remove = async (req, res, next) => {
    console.log("SoundFxController => remove");
    const { id } = req.params;

    await SoundFxService().deleteSoundFx(id);

    req.msg = "soundfx_deleted";
    next();
  };

  return { list, create, update, delete: remove };
};
