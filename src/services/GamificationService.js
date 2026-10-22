const User = require("../models/User");
const NotificationTriggerService = require("./NotificationTriggerService");

// Simple, predictable curve: level N requires N * 500 total XP.
// (Level 1 -> 2 needs 500xp, Level 12 -> 13 needs 6500xp, matching the
// "350 XP to Level 13" style progress shown in the app.)
const XP_PER_LEVEL = 500;

const LEVEL_TITLES = [
  { minLevel: 1, title: "Street Rookie" },
  { minLevel: 5, title: "Gully Grinder" },
  { minLevel: 10, title: "Street Hustler" },
  { minLevel: 20, title: "Block Champion" },
  { minLevel: 30, title: "Gully Legend" },
];

const titleForLevel = (level) => {
  let title = LEVEL_TITLES[0].title;
  for (const entry of LEVEL_TITLES) {
    if (level >= entry.minLevel) title = entry.title;
  }
  return title;
};

const levelForXp = (xp) => Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);

const todayStr = () => new Date().toISOString().slice(0, 10);

module.exports = () => {
  const addXp = async (userId, amount, _reason) => {
    const user = await User.findById(userId);
    if (!user) return null;

    const previousLevel = levelForXp(user.xp);
    user.xp += amount;
    const newLevel = levelForXp(user.xp);
    user.level = newLevel;
    await user.save();

    if (newLevel > previousLevel) {
      await NotificationTriggerService().levelUp(
        userId,
        newLevel,
        titleForLevel(newLevel),
      );
    }

    return getProgress(userId, user);
  };

  // Called once per day per user (see AuthMiddleware) to advance the streak.
  // Consecutive-day activity increments it; a missed day resets to 1.
  const touchStreak = async (userId, userDoc) => {
    const user = userDoc || (await User.findById(userId));
    if (!user) return null;

    const today = todayStr();
    if (user.lastActiveDate === today) return user; // already counted today

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    user.streakCount = user.lastActiveDate === yesterday ? user.streakCount + 1 : 1;
    user.lastActiveDate = today;
    await user.save();
    return user;
  };

  const getProgress = async (userId, userDoc) => {
    const user = userDoc || (await User.findById(userId).lean());
    if (!user) return null;

    const level = user.level || levelForXp(user.xp);
    const xpIntoLevel = user.xp - (level - 1) * XP_PER_LEVEL;
    const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel;

    return {
      xp: user.xp,
      level,
      levelTitle: titleForLevel(level),
      xpIntoLevel,
      xpToNextLevel,
      xpPerLevel: XP_PER_LEVEL,
      streakCount: user.streakCount || 0,
    };
  };

  return { addXp, touchStreak, getProgress };
};
