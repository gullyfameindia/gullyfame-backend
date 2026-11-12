const mongoose = require("mongoose");
const ReelReport = require("../models/ReelReport");
const Reel = require("../models/Reel");

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const clip = (v, n = 500) => String(v || "").trim().slice(0, n);

module.exports = () => {
  /**
   * A user reports a reel. Reporting the same reel again updates the reason
   * and reopens a report an admin had dismissed.
   * Throws: reel_not_found, invalid_report_reason, cannot_report_own_reel.
   */
  const reportReel = async (reelId, reporterId, reason, details) => {
    if (!isId(reelId)) throw new Error("reel_not_found");
    const why = String(reason || "").trim().toLowerCase();
    if (!ReelReport.REPORT_REASONS.includes(why)) throw new Error("invalid_report_reason");

    const reel = await Reel.findOne({ _id: reelId, isDeleted: { $ne: true } })
      .select("_id author")
      .lean();
    if (!reel) throw new Error("reel_not_found");
    if (String(reel.author) === String(reporterId)) throw new Error("cannot_report_own_reel");

    const existing = await ReelReport.findOne({ reel: reel._id, reporter: reporterId });
    if (existing) {
      existing.reason = why;
      existing.details = clip(details);
      if (existing.status === "dismissed") {
        existing.status = "open";
        existing.reviewedBy = null;
        existing.reviewedAt = null;
        existing.reviewNote = "";
      }
      await existing.save();
      return { reportId: String(existing._id), reelId: String(reel._id), reported: true, alreadyReported: true };
    }

    try {
      const report = await ReelReport.create({
        reel: reel._id,
        reelAuthor: reel.author || null,
        reporter: reporterId,
        reason: why,
        details: clip(details),
      });
      return { reportId: String(report._id), reelId: String(reel._id), reported: true, alreadyReported: false };
    } catch (ex) {
      // Two taps at once: the other request created it.
      if (ex && ex.code === 11000) {
        const report = await ReelReport.findOne({ reel: reel._id, reporter: reporterId }).lean();
        return { reportId: String(report._id), reelId: String(reel._id), reported: true, alreadyReported: true };
      }
      throw ex;
    }
  };

  /**
   * Admin: reports, newest first. ?status=open|dismissed|removed|all (default open).
   * Each row has the reel, its author, the reporter and how many open reports
   * that reel has in total.
   */
  const listReports = async ({ status = "open", page = 1, limit = 20, reelId } = {}) => {
    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const st = String(status || "open").toLowerCase();
    if (st !== "all" && !ReelReport.REPORT_STATUSES.includes(st)) throw new Error("invalid_report_status");

    const query = {};
    if (st !== "all") query.status = st;
    if (reelId) {
      if (!isId(reelId)) return { page, limit, total: 0, totalPages: 0, reports: [] };
      query.reel = new mongoose.Types.ObjectId(String(reelId));
    }

    const [rows, total] = await Promise.all([
      ReelReport.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "reel",
          select: "_id video_url thumbnail_url caption status isDeleted deleteReason createdAt author",
          populate: { path: "author", select: "_id firstName lastName username profileImage" },
        })
        .populate("reporter", "_id firstName lastName username profileImage")
        .lean(),
      ReelReport.countDocuments(query),
    ]);

    // Open reports per reel, so the admin sees how many people flagged it.
    const reelIds = [...new Set(rows.map((r) => String((r.reel && r.reel._id) || r.reel)).filter(isId))];
    const counts = reelIds.length
      ? await ReelReport.aggregate([
          {
            $match: {
              reel: { $in: reelIds.map((id) => new mongoose.Types.ObjectId(id)) },
              status: "open",
            },
          },
          { $group: { _id: "$reel", n: { $sum: 1 } } },
        ])
      : [];
    const openByReel = new Map(counts.map((c) => [String(c._id), c.n]));

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      reports: rows.map((r) => ({
        ...r,
        openReportsForReel: openByReel.get(String((r.reel && r.reel._id) || r.reel)) || 0,
      })),
    };
  };

  /**
   * Admin decision on a report.
   *   action "dismiss" - keep the reel; this report is closed as dismissed.
   *   action "remove"  - remove the reel (soft delete, same as DELETE /admin/reels/:id)
   *                      and close every open report on it as removed.
   */
  const reviewReport = async (reportId, adminId, { action, note } = {}) => {
    if (!isId(reportId)) throw new Error("report_not_found");
    const act = String(action || "").toLowerCase();
    if (!["dismiss", "remove"].includes(act)) throw new Error("invalid_report_action");

    const report = await ReelReport.findById(reportId);
    if (!report) throw new Error("report_not_found");

    const now = new Date();
    const reviewNote = clip(note);

    if (act === "dismiss") {
      report.status = "dismissed";
      report.reviewedBy = adminId || null;
      report.reviewedAt = now;
      report.reviewNote = reviewNote;
      await report.save();
      return { report: report.toObject(), reelRemoved: false };
    }

    // Lazy require: ReelService requires this file too.
    const ReelService = require("./ReelService");
    let reelRemoved = false;
    try {
      await ReelService().deleteReel(report.reel, adminId, {
        byAdmin: true,
        reason: reviewNote || `Reported: ${report.reason}`,
      });
      reelRemoved = true;
    } catch (ex) {
      // Already deleted is fine - the reports still get closed.
      if (ex.message !== "reel_not_found") throw ex;
    }

    await ReelReport.updateMany(
      { reel: report.reel, status: "open" },
      { status: "removed", reviewedBy: adminId || null, reviewedAt: now, reviewNote },
    );
    const fresh = await ReelReport.findById(report._id).lean();
    return { report: fresh, reelRemoved };
  };

  /** Called when a reel is deleted any other way: close its open reports. */
  const closeReportsForDeletedReel = async (reelId) =>
    ReelReport.updateMany(
      { reel: reelId, status: "open" },
      { status: "removed", reviewedAt: new Date(), reviewNote: "Reel was deleted" },
    );

  return { reportReel, listReports, reviewReport, closeReportsForDeletedReel };
};
