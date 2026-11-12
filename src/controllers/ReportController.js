const ReportService = require("../services/ReportService");

const USER_ERRORS = {
  reel_not_found: 5,
  invalid_report_reason: 0,
  cannot_report_own_reel: 0,
};
const ADMIN_ERRORS = {
  report_not_found: 5,
  invalid_report_action: 0,
  invalid_report_status: 0,
};

const fail = (req, next, map, ex) => {
  if (!(ex && ex.message in map)) throw ex;
  req.rCode = map[ex.message];
  req.msg = ex.message;
  req.rData = {};
  return next();
};

module.exports = () => {
  /**
   * POST /reels/:reelId/report
   * Body: { reason: "spam" | "nudity" | "violence" | "hate" | "harassment" |
   *         "self_harm" | "copyright" | "misinformation" | "other", details?: string }
   */
  const reportReel = async (req, res, next) => {
    console.log("ReportController => reportReel");
    const { userId, reason, details } = req.body;
    const { reelId } = req.params;
    try {
      req.rData = await ReportService().reportReel(reelId, userId, reason, details);
    } catch (ex) {
      return fail(req, next, USER_ERRORS, ex);
    }
    req.msg = "reel_reported";
    next();
  };

  /** GET /admin/reports?status=open|dismissed|removed|all&page&limit&reelId */
  const listReports = async (req, res, next) => {
    console.log("ReportController => listReports");
    const { status, page, limit, reelId } = req.query;
    try {
      req.rData = await ReportService().listReports({ status, page, limit, reelId });
    } catch (ex) {
      return fail(req, next, ADMIN_ERRORS, ex);
    }
    req.msg = "success";
    next();
  };

  /** PATCH /admin/reports/:reportId  Body: { action: "dismiss" | "remove", note?: string } */
  const reviewReport = async (req, res, next) => {
    console.log("ReportController => reviewReport");
    const { adminId, action, note } = req.body;
    const { reportId } = req.params;
    try {
      req.rData = await ReportService().reviewReport(reportId, adminId, { action, note });
    } catch (ex) {
      return fail(req, next, ADMIN_ERRORS, ex);
    }
    req.msg = req.rData.reelRemoved ? "report_reel_removed" : "report_reviewed";
    next();
  };

  return { reportReel, listReports, reviewReport };
};
