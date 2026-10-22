// Lightweight in-process cron replacement (setInterval-based) — this app
// runs as a single Node process with no separate worker/queue infra, so
// there's no reason to pull in a job scheduler library for two daily checks.
const Competition = require("../models/Competition");
const User = require("../models/User");
const NotificationTriggerService = require("../services/NotificationTriggerService");

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// "Upcoming Event Alert" — notify participants of competitions starting
// within the next 24h, once per competition.
const checkUpcomingEvents = async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + DAY_MS);

  const competitions = await Competition.find({
    startDate: { $gte: now, $lte: soon },
    upcomingAlertSent: false,
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();

  for (const comp of competitions) {
    const participantIds = comp.participants || [];
    await Promise.all(
      participantIds.map((userId) =>
        NotificationTriggerService()
          .upcomingEvent(userId, { competitionId: comp._id, title: comp.title })
          .catch((e) => console.log("scheduler => upcomingEvent error", e.message)),
      ),
    );

    await Competition.updateOne(
      { _id: comp._id },
      { upcomingAlertSent: true },
    );
  }

  if (competitions.length) {
    console.log(`scheduler => sent upcoming-event alerts for ${competitions.length} competition(s)`);
  }
};

// "Profile Update" nudge — remind users with an incomplete profile
// (no photo, no username) at most once every 7 days.
const checkProfileNudges = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

  const users = await User.find({
    isActive: true,
    isDeleted: { $ne: true },
    $or: [{ profileImage: "" }, { username: "" }],
    $and: [
      {
        $or: [
          { lastProfileNudgeAt: null },
          { lastProfileNudgeAt: { $lte: sevenDaysAgo } },
        ],
      },
    ],
  })
    .select("_id")
    .limit(500) // cap per tick so one run can't blow up on a big user base
    .lean();

  for (const user of users) {
    await NotificationTriggerService()
      .profileUpdateNudge(user._id)
      .catch((e) => console.log("scheduler => profileNudge error", e.message));
    await User.updateOne({ _id: user._id }, { lastProfileNudgeAt: new Date() });
  }

  if (users.length) {
    console.log(`scheduler => sent profile nudges to ${users.length} user(s)`);
  }
};

const start = () => {
  const runSafely = (fn, name) => () =>
    fn().catch((e) => console.log(`scheduler => ${name} failed`, e.message));

  setInterval(runSafely(checkUpcomingEvents, "checkUpcomingEvents"), HOUR_MS);
  setInterval(runSafely(checkProfileNudges, "checkProfileNudges"), DAY_MS);

  // Run once shortly after boot too, instead of waiting a full interval.
  setTimeout(runSafely(checkUpcomingEvents, "checkUpcomingEvents"), 30 * 1000);
  setTimeout(runSafely(checkProfileNudges, "checkProfileNudges"), 60 * 1000);
};

module.exports = { start, checkUpcomingEvents, checkProfileNudges };
