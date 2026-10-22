const DailyMission = require("../models/DailyMission");
const WalletService = require("./WalletService");
const GamificationService = require("./GamificationService");
const NotificationTriggerService = require("./NotificationTriggerService");

const todayStr = () => new Date().toISOString().slice(0, 10);
const DEFAULT_TARGET = 5;
const REWARD_XP = 20;
const REWARD_COINS = 10;

module.exports = () => {
  // Lazily creates today's mission row on first touch. Fires the
  // "Daily Challenge Ready" notification exactly once per day per user.
  const getOrCreateToday = async (userId) => {
    const day = todayStr();
    let mission = await DailyMission.findOne({ user: userId, day });

    if (!mission) {
      mission = await DailyMission.create({
        user: userId,
        day,
        target: DEFAULT_TARGET,
        rewardXp: REWARD_XP,
        rewardCoins: REWARD_COINS,
      });

      NotificationTriggerService()
        .dailyChallengeReady(userId, DEFAULT_TARGET)
        .catch((e) => console.log("dailyChallengeReady error", e.message));
    }

    return mission;
  };

  // Call on every successful "vote" interaction (see ReelService.toggleAction).
  // Increments progress and pays out the reward exactly once when the
  // target is first reached.
  const registerVote = async (userId) => {
    const mission = await getOrCreateToday(userId);
    if (mission.completed) return mission;

    mission.current = Math.min(mission.target, mission.current + 1);
    const justCompleted = mission.current >= mission.target;
    if (justCompleted) mission.completed = true;
    await mission.save();

    if (justCompleted && !mission.rewardClaimed) {
      mission.rewardClaimed = true;
      await mission.save();

      await Promise.all([
        WalletService().credit(userId, mission.rewardCoins, {
          type: "MISSION_REWARD",
          note: "Daily mission reward",
        }),
        GamificationService().addXp(userId, mission.rewardXp, "daily_mission"),
        NotificationTriggerService().dailyChallengeComplete(
          userId,
          mission.rewardXp,
          mission.rewardCoins,
        ),
      ]);
    }

    return mission;
  };

  return { getOrCreateToday, registerVote };
};
