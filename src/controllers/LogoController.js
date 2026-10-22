const LogoService = require("../services/LogoService");
const fileUploadService = require("../util/s3");

module.exports = () => {
  const addLogo = async (req, res, next) => {
    console.log("LogoController => addLogo");

    let updateData = {}; // store only changed fields

    // ==== Upload logo (single or multiple) ====
    if (req.files?.logo) {
      const file = req.files.logo;
      const uploadRes = await fileUploadService.uploadFileToAws(file);
      updateData.logo = uploadRes.images; // array
    }

    // ==== Upload splash (single or multiple) ====
    if (req.files?.splash) {
      const file = req.files.splash;
      const uploadRes = await fileUploadService.uploadFileToAws(file);
      updateData.splash = uploadRes.images; // array
    }

    // Fetch existing record
    let logs = await LogoService().fetchByQuery({});

    if (logs) {
      // Update only changed fields
      await LogoService().updateLogos(logs._id, updateData);
    } else {
      // Create new
      await LogoService().addLogos(updateData);
    }

    req.msg = "success";
    req.rData = {};
    next();
  };

  const getDetails = async (req, res, next) => {
    console.log("LogoController => getDetails");
    let { logoId } = req.body;
    if (!logoId) logoId = req.params.id;

    let Logo = await LogoService().fetch(logoId);

    req.rData = Logo;

    next();
  };

  const editLogo = async (req, res, next) => {
    console.log("schoolController => editLogo");
    let logoId = req.params.id;

    await LogoService().updateLogos(logoId, req.body);
    req.msg = "success";
    next();
  };

  const getAllLogoList = async (req, res, next) => {
    console.log("LogoController => getAllLogoList");

    let logs = await LogoService().fetchByQuery({});

    req.msg = "success";
    req.rData = logs.logo;

    next();
  };

  const getSplash = async (req, res, next) => {
    console.log("LogoController => getSplash");

    let logs = await LogoService().fetchByQuery({});

    req.msg = "success";
    req.rData = logs.splash;

    next();
  };

  const updateStatus = async (req, res, next) => {
    console.log("LogoController => updateStatus");
    let { status } = req.body;
    let logoId = req.params.id;

    let student_data = { status };
    student = await LogoService().updateLogos(logoId, student_data);
    req.msg = "status_changed";
    next();
  };

  const deleteLogo = async (req, res, next) => {
    console.log("LogoController => deleteLogo");
    let { logoId } = req.body;

    let result = await LogoService().deleteAbout(logoId);
    req.msg = "Logo_deleted";
    next();
  };

  const activateDeactivateLogo = async (req, res, next) => {
    console.log("LogoController => activateDeactivateLogo");
    let { isActive, logoId } = req.body;

    let student_data = { isActive: isActive };
    let student = await LogoService().updateAbout(logoId, student_data);
    req.msg = isActive == 1 ? "Logo_activated" : "Logo_deactivated";
    next();
  };

  return {
    addLogo,
    getDetails,
    editLogo,
    getAllLogoList,
    updateStatus,
    deleteLogo,
    activateDeactivateLogo,
    getSplash,
  };
};
