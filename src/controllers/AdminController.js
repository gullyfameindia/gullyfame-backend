"use strict";

const BannersService = require("../services/BannerService");
const AdminService = require("../services/AdminService");
const RegexEscape = require("regex-escape");
const SettingsService = require("../services/SettingsService");
const FAQService = require("../services/FAQService");
const helpers = require("../util/helpers");
const fileUploadService = require("../util/s3");

module.exports = () => {
  const login = async (req, res, next) => {
    console.log("AdminController => login");
    let { email, password } = req.body;
    email = email.toLowerCase();
    let query = { email };
    let admin = await AdminService().fetchByQuery(query);
    let token = "";
    if (admin) {
      let token = await helpers().createJWT({
        adminId: admin._id,
        isAdmin: true,
      });

      let passwordVerify = await AdminService().verifyPassword(
        admin._id,
        password
      );

      if (!passwordVerify) {
        token = await helpers().createJWT({
          adminId: admin._id,
          isAdmin: true,
        });
        await AdminService().updateProfile(admin._id, { token });
        req.rCode = 0;
        req.msg = "incorrect_password";
        req.rData = {};
      } else {
        let lastLogin = new Date();
        await AdminService().updateProfile(admin._id, { lastLogin });

        if (!token) {
          token = await helpers().createJWT({
            adminId: admin._id,
            isAdmin: true,
          });
          await AdminService().updateProfile(admin._id, { token });
        }

        admin = await AdminService().fetchByQuery(query);

        req.rData = { admin, token };
      }
    } else {
      req.rCode = 0;
      req.msg = "admin_not_found";
      req.rData = {};
    }

    next();
  };

  const register = async (req, res, next) => {
    console.log("AdminController => register");
    let { email, password, name, mobile, countryCode } = req.body;

    email = email.toLowerCase();
    let query = { email };
    let token = "";
    let admin = await AdminService().fetchByQuery(query);
    if (admin) {
      req.rCode = 0;
      req.msg = "admin_already_found";
      req.rData = { token };
    } else {
      password = await helpers().hashPassword(password);
      // let adminType = "super";

      admin = { email, password, name };

      let result = await AdminService().registerAdmin(admin);

      admin = await AdminService().fetchByQuery(query);

      // token = await helpers().createJWT({ adminId: admin._id, isAdmin: true });
      await AdminService().updateProfile(admin._id, {});

      admin = await AdminService().fetchByQuery(query);

      req.rData = { admin };
    }

    next();
  };

  const addAdmin = async (req, res, next) => {
    console.log("AdminController => register");
    let {
      email,
      password,
      firstName,
      lastName,
      mobile,
      // countryCode,
      image,
      modules,
      designation,
    } = req.body;

    email = email.toLowerCase();

    modules = JSON.parse(modules);

    let query = { email };
    let token = "";
    let admin = await AdminService().fetchByQuery(query);
    // console.log(admin);
    if (admin) {
      req.rCode = 0;
      req.msg = "admin_already_found";
      req.rData = { token };
    } else {
      password = await helpers().hashPassword(password);
      let adminType = "subAdmin";

      admin = {
        email,
        password,
        firstName,
        lastName,
        mobile,
        // countryCode,
        adminType,
        modules,
        designation,
        image,
      };

      let result = await AdminService().registerAdmin(admin);

      admin = await AdminService().fetchByQuery(query);

      token = await helpers().createJWT({ adminId: admin._id, isAdmin: true });
      await AdminService().updateProfile(admin._id, { token });

      admin = await AdminService().fetchByQuery(query);

      req.rData = { admin };
    }

    next();
  };

  const editAdmin = async (req, res, next) => {
    console.log("adminController => editAdmin");
    let adminId = req.body.adminId;

    await AdminService().updateProfile(adminId, req.body);
    let Admin = await AdminService().fetch(adminId);

    req.rData = Admin;

    req.msg = "success";
    next();
  };

  const getDetails = async (req, res, next) => {
    console.log("adminController => getDetails");
    let { adminId } = req.query;
    if (!adminId) adminId = req.body.adminId;
    let admin = await AdminService().fetch(adminId);
    console.log("admin");
    console.log(admin);
    if (admin) {
      req.msg = "admin_details";
      req.rData = { admin };
    } else {
      req.rCode = 0;
      req.msg = "admin_not_found";
      req.rData = {};
    }

    next();
  };

  const forgotPassword = async (req, res, next) => {
    let { email } = req.body;

    if (email) {
      email = email.toLowerCase();
    }

    let email_query = {
      email,
    };

    let user = await AdminService().fetchByQuery(email_query);

    if (user) {
      let otp = helpers().generateOTP();

      await AdminService().updateProfile(user._id, { otp });
      user = await AdminService().fetch(user._id);

      req.msg = "otp_sent_on_mail";
      req.rData = {};
    } else {
      req.rCode = 0;
      req.msg = "admin_not_found";
      req.rData = {};
    }

    next();
  };

  const verifyOtpForForgotPassword = async (req, res, next) => {
    console.log("AdminController => verifyOtpForForgotPassword");

    let { email, otp } = req.body;

    // var verify = code == "1234" ? true : false;

    if (!email) {
      return res
        .status(400)
        .send({ code: 0, message: "email require!", data: {} });
    }

    let otpUser = 1234;
    email = email.toLowerCase();

    var query = { email };
    let user = null;
    var msg = "admin_not_found";
    let token = null;

    email = email.toLowerCase();

    var query = { email };

    user = await AdminService().fetchByQuery(query);

    if (user) {
      token = await helpers().createJWT({ adminId: user._id, isAdmin: true });

      otpUser = user.otp;
    } else {
      msg = "admin_not_found";
    }

    console.log("otpUser", otpUser, "\notp", otp);

    console.log(otp == (1234 || otpUser));

    var verify = otp == (1234 || otpUser) ? true : false;

    if (user) {
      if (verify) {
        req.rData = { token, user };
        req.msg = "otp_verified";
      } else {
        req.rCode = 0;
        req.msg = "incorrect_otp";
      }
    } else {
      req.rCode = 0;
      req.msg = msg;
    }
    next();
  };

  const resendOtpForEmail = async (req, res, next) => {
    console.log("AdminController => resendOtpForEmail");
    let { email } = req.body;

    if (email) {
      email = email.toLowerCase();
    }

    var query = { email };

    let user = await AdminService().fetchByQuery(query);
    req.msg = "admin_not_found";

    if (user) {
      let otp = helpers().generateOTP();

      await AdminService().updateProfile(user._id, { otp });

      req.rData = {};
      req.msg = "otp_sent_on_mail";
    } else {
      req.rCode = 0;
      req.msg = msg;
    }
    next();
  };

  const resetPassword = async (req, res, next) => {
    console.log("AdminController => resetPassword");
    let { newPassword, confirmPassword, adminId, subAdminId } = req.body;

    if (subAdminId) {
      adminId = subAdminId;
    }

    if (confirmPassword !== newPassword) {
      return res.status(400).send({
        code: 0,
        message: "confirmPassword and newPassword not matched!",
      });
    }

    let password = await helpers().hashPassword(newPassword);

    await AdminService().updateProfile(adminId, { password });

    req.msg = "password_changed";
    next();
  };

  const changePassword = async (req, res, next) => {
    console.log("AdminController => changePassword");
    let { currentPassword, newPassword, adminId, confirmPassword, subAdminId } =
      req.body;

    if (subAdminId) {
      adminId = subAdminId;
    }

    let passwordVerify = await AdminService().verifyPassword(
      adminId,
      currentPassword
    );

    if (confirmPassword !== newPassword) {
      return res.status(400).send({
        code: 0,
        message: "confirmPassword and newPassword not matched!",
      });
    }

    if (!passwordVerify) {
      req.rCode = 0;
      req.msg = "incorrect_current_password";
      req.rData = {};
    } else {
      newPassword = await helpers().hashPassword(newPassword);

      await AdminService().resetPassword(adminId, newPassword);

      req.msg = "password_changed";
    }

    next();
  };

  /**
   * Banners
   */
  const addBanner = async (req, res, next) => {
    console.log("AdminController => addBanner");

    if (req.files && req.files.banner) {
      const file = req.files.banner;

      const uploadRes = await fileUploadService.uploadFileToAws(file);
      req.body.banner = uploadRes.images[0];
    }

    const Banners = await BannersService().addBanners(req.body);

    req.rData = Banners;

    req.msg = "success";
    next();
  };

  const updateBanner = async (req, res, next) => {
    console.log("AdminController => updateBanner");

    const { id } = req.params;
    if (req.files && req.files.banner) {
      const file = req.files.banner;

      const uploadRes = await fileUploadService.uploadFileToAws(file);
      req.body.banner = uploadRes.images[0];
    }

    const Banners = await BannersService().updateBanners(id, req.body);

    req.rData = Banners;

    req.msg = "success";
    next();
  };

  const getBanner = async (req, res, next) => {
    console.log("AdminController => getBanner");

    let { page, limit, isActive, search } = req.query;
    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 10;
    let query = {};

    if (search) {
      query = {
        $or: [
          {
            title: { $regex: RegexEscape(search), $options: "i" },
          },
        ],
      };
    }

    if (isActive) query.isActive = isActive;

    let Banners = await BannersService().getBanners(query, page, limit);
    let total = await BannersService().countBanners(query);

    req.rData = { page, limit, isActive, total, Banners };
    req.msg = "success";
    next();
  };

  const getBannerDetail = async (req, res, next) => {
    console.log("AdminController => getBannerDetail");
    let { id } = req.params;

    let Banners = await BannersService().fetch(id);

    req.rData = Banners;
    req.msg = "success";
    next();
  };

  const deleteBanner = async (req, res, next) => {
    console.log("AdminController => deleteBanner");
    const { id } = req.params;

    await BannersService().deleteBanners(id);

    req.msg = "success";
    next();
  };

  const activateDeactivateBanner = async (req, res, next) => {
    console.log("AdminController => activateDeactivateBanner");
    let { status, bannerId } = req.body;

    let banners = await BannersService().fetch(bannerId);

    if (banners) {
      if (banners.isActive == 0) {
        status = 1;
      } else {
        status = 0;
      }
      let banners_data = { isActive: status };
      banners = await BannersService().updateBanners(bannerId, banners_data);
    } else {
      return res
        .status(400)
        .send({ code: 0, message: "Banner not found!", data: {} });
    }

    req.msg = "status_changed";
    next();
  };

  /**
   * Settings
   */

  const addTermAndCondition = async (req, res, next) => {
    console.log("AdminController => addTermAndCondition");

    let { termsAndConditions } = req.body;

    let Settings = await SettingsService().fetchByQuery({});

    if (
      Settings &&
      (Settings.termsAndConditions || Settings.termsAndConditions == "")
    ) {
      await SettingsService().updateSettings(Settings._id, {
        termsAndConditions,
      });
    } else {
      await SettingsService().addSettings({ termsAndConditions });
    }

    req.rData = {};

    req.msg = "success";
    next();
  };

  const addPrivacyPolicy = async (req, res, next) => {
    console.log("AdminController => addPrivacyPolicy");

    let { privacyPolicy } = req.body;

    let Settings = await SettingsService().fetchByQuery({});

    if (Settings && (Settings.privacyPolicy || Settings.privacyPolicy == "")) {
      await SettingsService().updateSettings(Settings._id, {
        privacyPolicy,
      });
    } else {
      await SettingsService().addSettings({ privacyPolicy });
    }

    req.rData = {};
    req.msg = "success";
    next();
  };

  const addAboutUs = async (req, res, next) => {
    console.log("AdminController => addAboutUs");

    let { aboutUs } = req.body;

    let Settings = await SettingsService().fetchByQuery({});

    if (Settings && (Settings.aboutUs || Settings.aboutUs == "")) {
      await SettingsService().updateSettings(Settings._id, {
        aboutUs,
      });
    } else {
      await SettingsService().addSettings({ aboutUs });
    }

    req.rData = {};
    req.msg = "success";
    next();
  };

  const addCompetitionRules = async (req, res, next) => {
    console.log("AdminController => addCompetitionRules");

    let { competitionRules } = req.body;

    let Settings = await SettingsService().fetchByQuery({});

    if (
      Settings &&
      (Settings.competitionRules || Settings.competitionRules == "")
    ) {
      await SettingsService().updateSettings(Settings._id, {
        competitionRules,
      });
    } else {
      await SettingsService().addSettings({ competitionRules });
    }

    req.rData = {};

    req.msg = "success";
    next();
  };

  const getCompetitionRules = async (req, res, next) => {
    console.log("AdminController => getCompetitionRules");
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

  const getTermAndCondition = async (req, res, next) => {
    console.log("AdminController => getTermAndCondition");
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

  const getPrivacyPolicy = async (req, res, next) => {
    console.log("AdminController => getPrivacyPolicy");
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

  const getAboutUs = async (req, res, next) => {
    console.log("AdminController => getAboutUs");
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

  /**
   * contactUs
   */

  const contactUs = async (req, res, next) => {
    console.log("AdminController => contactUs");

    let { contactUs } = req.body;

    let Settings = await SettingsService().fetchByQuery({});

    if (Settings) {
      await SettingsService().updateSettings(Settings._id, {
        contactUs,
      });
    } else {
      await SettingsService().addSettings({ contactUs });
    }

    req.rData = {};
    req.msg = "success";
    next();
  };

  const getContactUs = async (req, res, next) => {
    console.log("AdminController => getContactUs");
    let Settings = await SettingsService().fetchByQuery({});
    if (Settings) {
      req.rData = Settings.contactUs;
    } else {
      req.rCode = 0;
      req.msg = "Settings_not_found";
      req.rData = {};
    }

    next();
  };

  /**
   * FAQs
   */
  const addFaqs = async (req, res, next) => {
    console.log("AdminController => addFaqs");

    let { faqId } = req.body;

    let FAQs = {};

    if (faqId) {
      await FAQService().updateFAQ(faqId, req.body);

      FAQs = await FAQService().fetch(faqId);
    } else {
      FAQs = await FAQService().addFAQ(req.body);
    }

    req.rData = FAQs;

    req.msg = "success";
    next();
  };

  const Faqs = async (req, res, next) => {
    console.log("AdminController => Faqs");

    let { page, limit, isActive, search } = req.query;
    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 10;
    let query = {
      isDeleted: false,
    };

    if (search) {
      query = {
        $or: [
          {
            question: { $regex: RegexEscape(search), $options: "i" },
          },
          {
            answer: { $regex: RegexEscape(search), $options: "i" },
          },
        ],
        isDeleted: false,
      };
    }

    if (isActive) query.isActive = isActive;

    let faqs = await FAQService().getFAQ(query, page, limit);
    let total = await FAQService().countFAQ(query);

    req.rData = { page, limit, isActive, search, total, faqs };
    req.msg = "success";
    next();
  };

  const faqsDetail = async (req, res, next) => {
    console.log("AdminController => faqsDetail");
    let { id } = req.params;

    let faqs = await FAQService().fetch(id);

    req.rData = faqs;
    req.msg = "success";
    next();
  };

  const deleteFaq = async (req, res, next) => {
    console.log("AdminController => deleteFaq");
    let { faqId } = req.body;

    await FAQService().updateFAQ(faqId, {
      isDeleted: true,
    });

    req.msg = "success";
    next();
  };

  const activateDeactivateFaqs = async (req, res, next) => {
    console.log("AdminController => activateDeactivateFaqs");
    let { status, faqId } = req.body;

    let faqs = await FAQService().fetch(faqId);

    if (faqs) {
      if (faqs.isActive == 0) {
        status = 1;
      } else {
        status = 0;
      }

      let faqs_data = { isActive: status };

      faqs = await FAQService().updateFAQ(faqId, faqs_data);
    } else {
      return res
        .status(400)
        .send({ code: 0, message: "FAQ not found!", data: {} });
    }

    req.msg = "status_changed";
    next();
  };

  return {
    login,
    register,
    editAdmin,
    getDetails,
    changePassword,
    addAdmin,
    forgotPassword,
    verifyOtpForForgotPassword,
    resendOtpForEmail,
    resetPassword,
    /**
     * Banners
     */
    getBanner,
    addBanner,
    deleteBanner,
    getBannerDetail,
    activateDeactivateBanner,
    updateBanner,
    /*
     * Setting
     */
    addTermAndCondition,
    addPrivacyPolicy,
    addAboutUs,
    getTermAndCondition,
    getPrivacyPolicy,
    getAboutUs,
    addCompetitionRules,
    getCompetitionRules,
    /**
     * ContactUs
     */
    contactUs,
    getContactUs,
    /**
     * FAQ
     */
    addFaqs,
    Faqs,
    faqsDetail,
    deleteFaq,
    activateDeactivateFaqs,
  };
};
