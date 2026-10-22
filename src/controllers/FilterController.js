const FilterService = require("../services/FilterService");
const fileUploadService = require("../util/s3");

module.exports = () => {
  const list = async (req, res, next) => {
    console.log("FilterController => list");
    const filters = await FilterService().list();

    req.rData = filters;
    req.msg = "success";
    next();
  };

  const create = async (req, res, next) => {
    console.log("FilterController => create");
    const { name } = req.body;

    if (!req.files || !req.files.asset) {
      req.rCode = 0;
      req.msg = "filter_asset_required";
      return next();
    }

    const uploadRes = await fileUploadService.uploadFileToAws(
      req.files.asset,
    );
    const assetUrl = uploadRes.images[0];

    let thumbnail = "";
    if (req.files.thumbnail) {
      const thumbUpload = await fileUploadService.uploadFileToAws(
        req.files.thumbnail,
      );
      thumbnail = thumbUpload.images[0];
    }

    const filter = await FilterService().addFilter({
      name,
      assetUrl,
      thumbnail,
    });

    req.rData = filter;
    req.msg = "filter_created";
    next();
  };

  const update = async (req, res, next) => {
    console.log("FilterController => update");
    const { id } = req.params;

    await FilterService().updateFilter(id, req.body);

    req.msg = "success";
    next();
  };

  const remove = async (req, res, next) => {
    console.log("FilterController => remove");
    const { id } = req.params;

    await FilterService().deleteFilter(id);

    req.msg = "filter_deleted";
    next();
  };

  return { list, create, update, delete: remove };
};
