const BannerService = require("../services/BannerService");
const fileUploadService = require("../util/s3");

module.exports = () => {
  const create = async (req, res, next) => {
    let data = { ...req.body };

    // Upload mobile view image
    if (req.files?.mobileView) {
      const upload = await fileUploadService.uploadFileToAws(
        req.files.mobileView
      );
      data.mobileView = upload.images[0] || upload.images;
    }

    // Upload iPad view image
    if (req.files?.ipadView) {
      const upload = await fileUploadService.uploadFileToAws(
        req.files.ipadView
      );
      data.ipadView = upload.images[0] || upload.images;
    }

    // Upload desktop view image
    if (req.files?.desktopView) {
      const upload = await fileUploadService.uploadFileToAws(
        req.files.desktopView
      );
      data.desktopView = upload.images[0] || upload.images;
    }

    const banner = await BannerService().create(data);

    req.rData = banner;
    req.msg = "banner_created";
    next();
  };

  const list = async (req, res, next) => {
    const banners = await BannerService().getAll();

    req.rData = banners;
    req.msg = "success";
    next();
  };

  const update = async (req, res, next) => {
    const { id } = req.params;
    let data = { ...req.body };

    // Upload mobile view image if provided
    if (req.files?.mobileView) {
      const upload = await fileUploadService.uploadFileToAws(
        req.files.mobileView
      );
      data.mobileView = upload.images[0] || upload.images;
    }

    // Upload iPad view image if provided
    if (req.files?.ipadView) {
      const upload = await fileUploadService.uploadFileToAws(
        req.files.ipadView
      );
      data.ipadView = upload.images[0] || upload.images;
    }

    // Upload desktop view image if provided
    if (req.files?.desktopView) {
      const upload = await fileUploadService.uploadFileToAws(
        req.files.desktopView
      );
      data.desktopView = upload.images[0] || upload.images;
    }

    const banner = await BannerService().update(id, data);

    req.rData = banner;
    req.msg = "banner_updated";
    next();
  };

  const deleteBanner = async (req, res, next) => {
    const { id } = req.params;

    await BannerService().delete(id);

    req.msg = "banner_deleted";
    next();
  };

  return { create, list, update, delete: deleteBanner };
};
