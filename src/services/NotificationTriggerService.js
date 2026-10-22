// Central place for every "why did this notification get created" rule.
// Keeping these together makes it obvious what fires a push vs. what's
// purely in-app, and stops the trigger logic from being scattered across
// unrelated services.
const NotificationService = require("./NotificationService");

module.exports = () => {
  const rankBoost = async (userId) => {
    return NotificationService().notifyUser(userId, {
      title: "Rank Boost!",
      description: "Your Gully Score just climbed higher.",
      type: "RANK_BOOST",
      data: {},
    });
  };

  const levelUp = async (userId, level, levelTitle) => {
    return NotificationService().notifyUser(userId, {
      title: `Level Up! You're now Level ${level}`,
      description: `You've reached "${levelTitle}" — keep the streak going.`,
      type: "LEVEL_UP",
      data: { level, levelTitle },
    });
  };

  const dailyChallengeReady = async (userId, target) => {
    return NotificationService().notifyUser(userId, {
      title: "Daily Challenge Ready",
      description: `Drop your bars to earn points today. Vote on ${target} videos.`,
      type: "DAILY_CHALLENGE_READY",
      data: { target },
    });
  };

  const dailyChallengeComplete = async (userId, rewardXp, rewardCoins) => {
    return NotificationService().notifyUser(userId, {
      title: "Daily Mission Complete!",
      description: `You earned ${rewardXp} XP and ${rewardCoins} coins.`,
      type: "DAILY_CHALLENGE_COMPLETE",
      data: { rewardXp, rewardCoins },
    });
  };

  const rapBattleInvite = async (userId, { competitionId, fromUserId }) => {
    return NotificationService().notifyUser(userId, {
      title: "New Rap Battle Invite",
      description: "A challenger just called you out!",
      type: "RAP_BATTLE_INVITE",
      data: { competitionId, fromUserId },
    });
  };

  const upcomingEvent = async (userId, { competitionId, title }) => {
    return NotificationService().notifyUser(userId, {
      title: "Upcoming Event Alert",
      description: `${title || "A new cypher"} is happening this weekend.`,
      type: "UPCOMING_EVENT",
      data: { competitionId },
    });
  };

  const profileUpdateNudge = async (userId) => {
    return NotificationService().notifyUser(userId, {
      title: "Profile Update",
      description: "Add new clips to increase your visibility.",
      type: "PROFILE_UPDATE",
      data: {},
    });
  };

  const supportReceived = async (userId, { fromUserId, amount, reelId }) => {
    return NotificationService().notifyUser(userId, {
      title: "Support Received!",
      description: `Someone just supported you with ${amount} coins.`,
      type: "SUPPORT_RECEIVED",
      data: { fromUserId, amount, reelId },
    });
  };

  return {
    rankBoost,
    levelUp,
    dailyChallengeReady,
    dailyChallengeComplete,
    rapBattleInvite,
    upcomingEvent,
    profileUpdateNudge,
    supportReceived,
  };
};
