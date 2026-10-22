const SettingsService = require("../services/SettingsService");

module.exports = () => {
  const getTerms = async (req, res, next) => {
    console.log("PublicContentController => getTerms");
    let Settings = await SettingsService().fetchByQuery({});
    if (Settings) {
      req.rData = Settings.termsAndConditions;
    } else {
      req.rCode = 0;
      req.msg = "Settings_not_found";
      req.rData = {};
    }

    next();
  };

  const getAboutUs = async (req, res, next) => {
    console.log("PublicContentController => getAboutUs");
    let Settings = await SettingsService().fetchByQuery({});
    if (Settings) {
      req.rData = Settings.aboutUs;
    } else {
      req.rCode = 0;
      req.msg = "Settings_not_found";
      req.rData = {};
    }

    next();
  };

  const getPrivacyPolicy = async (req, res, next) => {
    console.log("PublicContentController => getPrivacyPolicy");
    let Settings = await SettingsService().fetchByQuery({});
    if (Settings) {
      req.rData = Settings.privacyPolicy;
    } else {
      req.rCode = 0;
      req.msg = "Settings_not_found";
      req.rData = {};
    }

    next();
  };

  const getCompetitionRules = async (req, res, next) => {
    console.log("PublicContentController => getCompetitionRules");
    let Settings = await SettingsService().fetchByQuery({});
    if (Settings) {
      req.rData = Settings.competitionRules;
    } else {
      req.rCode = 0;
      req.msg = "Settings_not_found";
      req.rData = {};
    }

    next();
  };

  return { getTerms, getAboutUs, getPrivacyPolicy, getCompetitionRules };
};
