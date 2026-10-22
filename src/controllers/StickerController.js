const StickerService = require("../services/StickerService");
const fileUploadService = require("../util/s3");

module.exports = () => {
  const list = async (req, res, next) => {
    console.log("StickerController => list");
    const stickers = await StickerService().list();

    req.rData = stickers;
    req.msg = "success";
    next();
  };

  const create = async (req, res, next) => {
    console.log("StickerController => create");
    const { name, category } = req.body;

    if (!req.files || !req.files.image) {
      req.rCode = 0;
      req.msg = "sticker_image_required";
      return next();
    }

    const uploadRes = await fileUploadService.uploadFileToAws(
      req.files.image,
    );
    const imageUrl = uploadRes.images[0];

    const sticker = await StickerService().addSticker({
      name,
      category,
      imageUrl,
    });

    req.rData = sticker;
    req.msg = "sticker_created";
    next();
  };

  const update = async (req, res, next) => {
    console.log("StickerController => update");
    const { id } = req.params;

    await StickerService().updateSticker(id, req.body);

    req.msg = "success";
    next();
  };

  const remove = async (req, res, next) => {
    console.log("StickerController => remove");
    const { id } = req.params;

    await StickerService().deleteSticker(id);

    req.msg = "sticker_deleted";
    next();
  };

  return { list, create, update, delete: remove };
};
