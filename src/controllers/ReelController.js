const ReelService = require("../services/ReelService");
const ExportService = require("../services/ExportService");
const fileUploadService = require("../util/s3");

module.exports = () => {
  // Editor uploads (clip, voice-over) land in the public media/ area of S3,
  // one folder per asset type. The client still sends assetType "reels" or
  // "voiceovers"; anything else falls back to reels.
  const UPLOAD_FOLDERS = {
    reels: "media/reels",
    voiceovers: "media/voiceovers",
  };

  const getUploadUrl = async (req, res, next) => {
    console.log("ReelController => getUploadUrl");
    const { fileName, fileType, assetType } = req.body;

    if (!fileName || !fileType) {
      req.rCode = 0;
      req.msg = "file_name_and_type_required";
      return next();
    }

    const folder = Object.prototype.hasOwnProperty.call(UPLOAD_FOLDERS, assetType)
      ? UPLOAD_FOLDERS[assetType]
      : UPLOAD_FOLDERS.reels;

    const data = await fileUploadService.getPresignedUploadUrl({
      fileName,
      contentType: fileType,
      folder,
    });

    req.rData = data;
    req.msg = "success";
    next();
  };

  const publish = async (req, res, next) => {
    console.log("ReelController => publish");
    const {
      userId,
      reelId,
      video_url,
      thumbnail_url,
      caption,
      competitionId,
      music,
      editState,
      voiceOver,
      ctaLink,
    } = req.body;

    const reel = await ReelService().publishReel(reelId, userId, {
      video_url,
      thumbnail_url,
      caption,
      competition: competitionId || null,
      music,
      editState,
      voiceOver,
      ctaLink,
    });

    req.rData = reel;
    req.msg = "reel_published";
    next();
  };

  const saveDraft = async (req, res, next) => {
    console.log("ReelController => saveDraft");
    const {
      userId,
      reelId,
      video_url,
      thumbnail_url,
      caption,
      competitionId,
      music,
      editState,
      voiceOver,
      ctaLink,
    } = req.body;

    let draft;
    if (reelId) {
      draft = await ReelService().updateDraft(reelId, userId, {
        video_url,
        thumbnail_url,
        caption,
        competition: competitionId || null,
        music,
        editState,
        voiceOver,
        ctaLink,
      });
    }

    if (!draft) {
      draft = await ReelService().createDraftReel(userId, {
        video_url,
        thumbnail_url,
        caption,
        competition: competitionId || null,
        music,
        editState,
        voiceOver,
        ctaLink,
      });
    }

    req.rData = draft;
    req.msg = "draft_saved";
    next();
  };

  /**
   * DELETE /reels/:reelId - delete the caller's own reel.
   * The reel disappears from the app and its files are removed from S3.
   */
  const deleteReel = async (req, res, next) => {
    console.log("ReelController => deleteReel");
    const { userId } = req.body;
    const { reelId } = req.params;

    try {
      req.rData = await ReelService().deleteReel(reelId, userId, { byAdmin: false });
      req.msg = "reel_deleted";
    } catch (ex) {
      req.rCode = ex.message === "forbidden" ? 4 : 5;
      req.msg = ex.message === "forbidden" ? "not_your_reel" : "reel_not_found";
      req.rData = {};
    }

    next();
  };

  const getDraft = async (req, res, next) => {
    console.log("ReelController => getDraft");
    const { userId } = req.body;

    const draft = await ReelService().getDraftForUser(userId);

    req.rData = draft || {};
    req.msg = "success";
    next();
  };

  /**
   * POST /reels/:reelId/export - Kick off a server-side render (fallback for
   * on-device composition failures). Returns immediately with status=processing.
   */
  const startExport = async (req, res, next) => {
    console.log("ReelController => startExport");
    const { userId } = req.body;
    const { reelId } = req.params;

    const data = await ExportService.startExport(reelId, userId);

    req.rData = data;
    req.msg = "reel_export_queued";
    next();
  };

  /**
   * GET /reels/:reelId/export/status - Poll for export completion
   */
  const getExportStatus = async (req, res, next) => {
    console.log("ReelController => getExportStatus");
    const { userId } = req.body;
    const { reelId } = req.params;

    const data = await ExportService.getStatus(reelId, userId);

    if (!data) {
      req.rCode = 5;
      req.msg = "reel_not_found";
      return next();
    }

    req.rData = data;
    req.msg = "success";
    next();
  };

  return {
    getUploadUrl,
    deleteReel,
    publish,
    saveDraft,
    getDraft,
    startExport,
    getExportStatus,
  };
};
