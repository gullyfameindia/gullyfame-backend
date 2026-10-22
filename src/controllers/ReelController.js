const ReelService = require("../services/ReelService");
const ExportService = require("../services/ExportService");
const fileUploadService = require("../util/s3");

module.exports = () => {
  // Editor uploads (clip, voice-over) all land in S3 under distinct folders
  // so the client can request a presigned URL for whichever asset it's saving.
  const ALLOWED_UPLOAD_FOLDERS = ["reels", "voiceovers"];

  const getUploadUrl = async (req, res, next) => {
    console.log("ReelController => getUploadUrl");
    const { fileName, fileType, assetType } = req.body;

    if (!fileName || !fileType) {
      req.rCode = 0;
      req.msg = "file_name_and_type_required";
      return next();
    }

    const folder = ALLOWED_UPLOAD_FOLDERS.includes(assetType)
      ? assetType
      : "reels";

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
    publish,
    saveDraft,
    getDraft,
    startExport,
    getExportStatus,
  };
};
