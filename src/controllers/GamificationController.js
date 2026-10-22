const GamificationService = require("../services/GamificationService");
const DailyMissionService = require("../services/DailyMissionService");

module.exports = () => {
  const getProgress = async (req, res, next) => {
    console.log("GamificationController => getProgress");
    const { userId } = req.body;

    const data = await GamificationService().getProgress(userId);

    req.rData = data;
    req.msg = "success";
    next();
  };

  const getDailyMission = async (req, res, next) => {
    console.log("GamificationController => getDailyMission");
    const { userId } = req.body;

    const mission = await DailyMissionService().getOrCreateToday(userId);

    req.rData = {
      target: mission.target,
      current: mission.current,
      completed: mission.completed,
      rewardXp: mission.rewardXp,
      rewardCoins: mission.rewardCoins,
    };
    req.msg = "success";
    next();
  };

  return { getProgress, getDailyMission };
};
