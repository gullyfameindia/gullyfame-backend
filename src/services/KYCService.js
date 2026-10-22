const KYC = require("../models/KYC");

module.exports = () => {
  const fetchByUser = async (userId) => {
    return KYC.findOne({ user: userId }).lean();
  };

  const upsertForUser = async (userId, data) => {
    const existing = await KYC.findOne({ user: userId });

    if (existing) {
      existing.docType = data.docType;
      existing.frontImage = data.frontImage;
      existing.backImage = data.backImage || "";
      existing.status = "PENDING";
      existing.reason = "";
      existing.submittedAt = new Date();
      existing.reviewedAt = null;
      existing.reviewedBy = null;
      await existing.save();
      return existing;
    }

    return KYC.create({
      user: userId,
      docType: data.docType,
      frontImage: data.frontImage,
      backImage: data.backImage || "",
    });
  };

  const updateStatus = async (userId, { status, reason, adminId }) => {
    const kyc = await KYC.findOne({ user: userId });
    if (!kyc) return null;

    kyc.status = status;
    kyc.reason = reason || "";
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = adminId;
    await kyc.save();
    return kyc;
  };

  return { fetchByUser, upsertForUser, updateStatus };
};
