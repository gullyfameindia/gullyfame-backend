const mongoose = require("mongoose");
const ProfileView = require("../models/ProfileView");

// Days are counted in India time so "today" matches what users see.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (date) => new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

module.exports = () => {
  /**
   * Count a view of `profileId` by `viewerId`. Once per viewer per day; your
   * own profile never counts. Best effort: never throws.
   */
  const recordView = async (profileId, viewerId, now = new Date()) => {
    try {
      if (!isId(profileId) || !isId(viewerId)) return false;
      if (String(profileId) === String(viewerId)) return false;
      const day = dayKey(now);
      const res = await ProfileView.updateOne(
        { profile: profileId, viewer: viewerId, day },
        { $setOnInsert: { profile: profileId, viewer: viewerId, day } },
        { upsert: true },
      );
      return Boolean(res && res.upsertedCount);
    } catch (ex) {
      // Duplicate from a double tap, or the DB hiccuped: the profile still loads.
      if (!(ex && ex.code === 11000)) console.log("ProfileViewService => recordView", ex.message);
      return false;
    }
  };

  /**
   * Views of `profileId` over the last `days` days (today included, max 90).
   * -> { days, views, uniqueViewers, daily: [{ date, views }] } oldest day first.
   * `views` counts each viewer once per day.
   */
  const getInsights = async (profileId, days = 30, now = new Date()) => {
    days = Math.min(Math.max(parseInt(days) || 30, 1), ProfileView.RETENTION_DAYS);
    const keys = [];
    for (let i = days - 1; i >= 0; i--) keys.push(dayKey(new Date(now.getTime() - i * DAY_MS)));

    const rows = isId(profileId)
      ? await ProfileView.find({ profile: profileId, day: { $gte: keys[0], $lte: keys[keys.length - 1] } })
          .select("viewer day")
          .lean()
      : [];

    const perDay = new Map(keys.map((k) => [k, 0]));
    const viewers = new Set();
    for (const r of rows) {
      if (perDay.has(r.day)) perDay.set(r.day, perDay.get(r.day) + 1);
      viewers.add(String(r.viewer));
    }

    return {
      days,
      views: rows.length,
      uniqueViewers: viewers.size,
      daily: keys.map((date) => ({ date, views: perDay.get(date) })),
    };
  };

  return { recordView, getInsights, dayKey };
};
