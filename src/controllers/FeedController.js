const ReelService = require("../services/ReelService");

module.exports = () => {
  const getMatrix = async (req, res, next) => {
    console.log("FeedController => getMatrix");
    const { userId } = req.body;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;

    const data = await ReelService().getMatrix(userId, page, limit);

    req.rData = data;
    req.msg = "success";
    next();
  };

  const getCompetitionReels = async (req, res, next) => {
    console.log("FeedController => getCompetitionReels");
    const { userId } = req.body;
    const { competitionId } = req.params;
    const cursor = req.query.cursor || null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    if (!competitionId) {
      req.rCode = 0;
      req.msg = "competition_id_required";
      return next();
    }

    const data = await ReelService().getCompetitionReels(
      competitionId,
      userId,
      cursor,
      limit,
    );

    req.rData = data;
    req.msg = "success";
    next();
  };

  const toggleAction = async (req, res, next) => {
    console.log("FeedController => toggleAction");
    const { userId, action_type } = req.body;
    const { reelId } = req.params;

    if (!reelId) {
      req.rCode = 0;
      req.msg = "reel_id_required";
      return next();
    }

    const validActions = ["vote", "like", "save"];
    if (!action_type || !validActions.includes(action_type)) {
      req.rCode = 0;
      req.msg = "invalid_action_type";
      return next();
    }

    const data = await ReelService().toggleAction(reelId, userId, action_type);

    if (!data) {
      req.rCode = 5;
      req.msg = "reel_not_found";
      return next();
    }

    req.rData = data;
    req.msg = "success";
    next();
  };

  const listReels = async (req, res, next) => {
    console.log("FeedController => listReels");
    const { userId } = req.body;
    const cursor = req.query.cursor || null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const data = await ReelService().listReels(userId, cursor, limit);

    req.rData = data;
    req.msg = "success";
    next();
  };

  return { getMatrix, getCompetitionReels, toggleAction, listReels };
};
