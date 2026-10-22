const KYCService = require("../services/KYCService");
const fileUploadService = require("../util/s3");

module.exports = () => {
  const submitKYC = async (req, res, next) => {
    console.log("KYCController => submitKYC");
    const { userId, docType } = req.body;

    if (!docType || !req.files || !req.files.frontImage) {
      req.rCode = 0;
      req.msg = "kyc_fields_required";
      return next();
    }

    const frontUpload = await fileUploadService.uploadFileToAws(
      req.files.frontImage,
    );

    let backImage = "";
    if (req.files.backImage) {
      const backUpload = await fileUploadService.uploadFileToAws(
        req.files.backImage,
      );
      backImage = backUpload.images[0];
    }

    const kyc = await KYCService().upsertForUser(userId, {
      docType,
      frontImage: frontUpload.images[0],
      backImage,
    });

    req.rData = kyc;
    req.msg = "kyc_submitted";
    next();
  };

  const getMyKYC = async (req, res, next) => {
    console.log("KYCController => getMyKYC");
    const { userId } = req.body;

    const kyc = await KYCService().fetchByUser(userId);

    req.rData = kyc || {};
    req.msg = "success";
    next();
  };

  const getUserKYC = async (req, res, next) => {
    console.log("KYCController => getUserKYC");
    const { id } = req.params;

    const kyc = await KYCService().fetchByUser(id);

    if (!kyc) {
      req.rCode = 5;
      req.msg = "kyc_not_found";
      return next();
    }

    req.rData = kyc;
    req.msg = "success";
    next();
  };

  const updateUserKYC = async (req, res, next) => {
    console.log("KYCController => updateUserKYC");
    const { id } = req.params;
    const { status, reason, adminId } = req.body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      req.rCode = 0;
      req.msg = "invalid_kyc_status";
      return next();
    }

    const kyc = await KYCService().updateStatus(id, { status, reason, adminId });

    if (!kyc) {
      req.rCode = 5;
      req.msg = "kyc_not_found";
      return next();
    }

    req.rData = kyc;
    req.msg = "kyc_updated";
    next();
  };

  return { submitKYC, getMyKYC, getUserKYC, updateUserKYC };
};
