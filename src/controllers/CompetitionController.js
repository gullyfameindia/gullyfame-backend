const CompetitionService = require("../services/CompetitionService");

module.exports = () => {
  const getDetails = async (req, res, next) => {
    console.log("CompetitionController => getDetails");
    const { userId } = req.body;
    const { competitionId } = req.params;

    if (!competitionId) {
      req.rCode = 0;
      req.msg = "competition_id_required";
      return next();
    }

    const data = await CompetitionService().getCompetitionDetails(
      competitionId,
      userId,
    );

    if (!data) {
      req.rCode = 5;
      req.msg = "competition_not_found";
      return next();
    }

    req.rData = data;
    req.msg = "success";
    next();
  };

  const getLeaderboard = async (req, res, next) => {
    console.log("CompetitionController => getLeaderboard");
    const { userId } = req.body;
    const { competitionId } = req.params;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!competitionId) {
      req.rCode = 0;
      req.msg = "competition_id_required";
      return next();
    }

    const data = await CompetitionService().getLeaderboard(
      competitionId,
      userId,
      page,
      limit,
    );

    req.rData = data;
    req.msg = "success";
    next();
  };

  const getMine = async (req, res, next) => {
    console.log("CompetitionController => getMine");
    const { userId } = req.body;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const data = await CompetitionService().getMyCompetitions(
      userId,
      page,
      limit,
    );

    req.rData = data;
    req.msg = "success";
    next();
  };

  const join = async (req, res, next) => {
    console.log("CompetitionController => join");
    const { userId } = req.body;
    const { competitionId } = req.params;

    if (!competitionId) {
      req.rCode = 0;
      req.msg = "competition_id_required";
      return next();
    }

    const data = await CompetitionService().joinCompetition(
      competitionId,
      userId,
    );

    req.rData = data;
    req.msg = "competition_joined";
    next();
  };

  const invite = async (req, res, next) => {
    console.log("CompetitionController => invite");
    const { userId, toUserId } = req.body;
    const { competitionId } = req.params;

    if (!competitionId) {
      req.rCode = 0;
      req.msg = "competition_id_required";
      return next();
    }

    if (!toUserId) {
      req.rCode = 0;
      req.msg = "to_user_id_required";
      return next();
    }

    const data = await CompetitionService().inviteToCompetition(
      competitionId,
      userId,
      toUserId,
    );

    req.rData = data;
    req.msg = "success";
    next();
  };

  return { getDetails, getLeaderboard, getMine, join, invite };
};
