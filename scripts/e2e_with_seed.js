/* eslint-disable no-console */
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3552;
const BASE = `http://127.0.0.1:${PORT}/v1/api`;
const JWTSECRET = process.env.JWTSECRET;

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

let pass = 0;
let fail = 0;
const failures = [];

function assert(name, condition, detail) {
  if (condition) {
    pass++;
    console.log(`  ${c.green("PASS")} ${name}`);
  } else {
    fail++;
    failures.push({ name, detail });
    console.log(`  ${c.red("FAIL")} ${name} — ${detail || ""}`);
  }
}

function request(method, path, { token, query } = {}) {
  return new Promise((resolve, reject) => {
    const qs = query
      ? "?" +
        Object.entries(query)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join("&")
      : "";
    const url = new URL(BASE + path + qs);
    const req = http.request(
      {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(body);
          } catch (_) {
            parsed = body;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

const TAG = "__E2E_SEED__"; // tag in title/caption to find & clean later

async function seed(user) {
  const Competition = require("../src/models/Competition");
  const Reel = require("../src/models/Reel");

  // Cleanup any leftover from a prior aborted run
  await Reel.deleteMany({ caption: { $regex: TAG } });
  await Competition.deleteMany({ title: { $regex: TAG } });

  // 1. Create a LIVE competition the user has joined and submitted a reel to
  const comp = await Competition.create({
    title: `${TAG} Test LIVE comp`,
    subtitle: "seed",
    description: "seed",
    status: "LIVE",
    prizePool: 1000,
    entryFee: 0,
    startDate: new Date(Date.now() - 24 * 3600 * 1000),
    endDate: new Date(Date.now() + 24 * 3600 * 1000),
    participants: [user._id],
    isActive: true,
    isDeleted: false,
  });

  // 2. Create another competition the user only joined (no reel)
  const comp2 = await Competition.create({
    title: `${TAG} Test UPCOMING comp`,
    status: "UPCOMING",
    prizePool: 500,
    entryFee: 0,
    startDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    participants: [user._id],
    isActive: true,
    isDeleted: false,
  });

  // 3. Two reels by the user — to test Champions aggregation and Reels list
  const reel1 = await Reel.create({
    video_url: "https://example.com/seed1.mp4",
    thumbnail_url: "https://example.com/seed1.jpg",
    caption: `${TAG} reel-1`,
    author: user._id,
    competition: comp._id,
    stats: { votes: 42, likes: 10, comments: 0, shares: 0, saves: 0, tips: 0 },
    // Reels default to "draft", which the listing hides.
    status: "published",
    publishedAt: new Date(),
    isActive: true,
    isDeleted: false,
  });
  const reel2 = await Reel.create({
    video_url: "https://example.com/seed2.mp4",
    caption: `${TAG} reel-2`,
    author: user._id,
    stats: { votes: 7, likes: 1, comments: 0, shares: 0, saves: 0, tips: 0 },
    status: "published",
    publishedAt: new Date(),
    isActive: true,
    isDeleted: false,
  });

  return { comp, comp2, reel1, reel2 };
}

async function cleanup() {
  const Competition = require("../src/models/Competition");
  const Reel = require("../src/models/Reel");
  await Reel.deleteMany({ caption: { $regex: TAG } });
  await Competition.deleteMany({ title: { $regex: TAG } });
}

async function main() {
  console.log(c.bold(c.cyan("\n=== E2E test (with seeded data) ===\n")));

  // Fail fast before seeding anything if the API server isn't up.
  try {
    await request("GET", "/public/logos");
  } catch (e) {
    console.error(
      c.red(
        `Server is not running on port ${PORT}. Start it in another terminal with \`npm start\`, then run this again.`,
      ),
    );
    process.exit(2);
  }

  await mongoose.connect(process.env.LOCAL_MONGO_DB);

  const User = require("../src/models/User");
  const user = await User.findOne({
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();
  if (!user) throw new Error("no active user");
  console.log(c.cyan(`→ Test user: ${user._id}`));

  let seeded;
  try {
    seeded = await seed(user);
    console.log(
      c.cyan(
        `→ Seeded: comp=${seeded.comp._id} comp2=${seeded.comp2._id} reel1=${seeded.reel1._id} reel2=${seeded.reel2._id}`,
      ),
    );

    const token = jwt.sign({ userId: user._id.toString() }, JWTSECRET);

    // --- Champions ---
    console.log(c.bold("\n[1] Champions"));
    const champ = await request("GET", "/user/champaigns", {
      token,
      query: { page: 1, limit: 50 },
    });
    assert("champions: status 200", champ.status === 200);
    assert(
      "champions: data.champions populated",
      Array.isArray(champ.body?.data?.champions) &&
        champ.body.data.champions.length > 0,
      `len=${champ.body?.data?.champions?.length}`,
    );
    const me = champ.body.data.champions.find(
      (x) => x.id?.toString() === user._id.toString(),
    );
    assert(
      "champions: seeded user appears with totalVotes >= 49",
      me && me.totalVotes >= 49,
      `me=${JSON.stringify(me)}`,
    );
    assert(
      "champions: seeded user totalReels >= 2",
      me && me.totalReels >= 2,
      `totalReels=${me?.totalReels}`,
    );
    assert(
      "champions: rank field is positive integer",
      me && Number.isInteger(me.rank) && me.rank > 0,
      `rank=${me?.rank}`,
    );

    // --- My Competitions ---
    console.log(c.bold("\n[2] My Competitions"));
    const my = await request("GET", "/user/competitions", {
      token,
      query: { page: 1, limit: 50 },
    });
    assert("my-comp: status 200", my.status === 200);
    assert(
      "my-comp: returns at least 2 competitions",
      Array.isArray(my.body?.data?.competitions) &&
        my.body.data.competitions.length >= 2,
      `len=${my.body?.data?.competitions?.length}`,
    );
    const seededComp = my.body.data.competitions.find(
      (c) => c._id.toString() === seeded.comp._id.toString(),
    );
    const seededComp2 = my.body.data.competitions.find(
      (c) => c._id.toString() === seeded.comp2._id.toString(),
    );
    assert(
      "my-comp: includes LIVE comp the user submitted to (participation=submitted)",
      seededComp && seededComp.participation === "submitted",
      `comp=${JSON.stringify(seededComp)}`,
    );
    assert(
      "my-comp: includes UPCOMING comp user only joined (participation=joined)",
      seededComp2 && seededComp2.participation === "joined",
      `comp2=${JSON.stringify(seededComp2)}`,
    );
    assert(
      "my-comp: status normalized (LIVE / UPCOMING)",
      seededComp?.status === "LIVE" && seededComp2?.status === "UPCOMING",
      `${seededComp?.status} / ${seededComp2?.status}`,
    );

    // --- Reels listing ---
    console.log(c.bold("\n[3] Reels listing"));
    const reels = await request("GET", "/reels", {
      token,
      query: { limit: 20 },
    });
    assert("reels: status 200", reels.status === 200);
    assert(
      "reels: returns at least 2 reels",
      Array.isArray(reels.body?.data?.reels) &&
        reels.body.data.reels.length >= 2,
      `len=${reels.body?.data?.reels?.length}`,
    );
    const seededReel = reels.body.data.reels.find(
      (r) => r._id.toString() === seeded.reel1._id.toString(),
    );
    assert(
      "reels: seeded reel present",
      seededReel !== undefined,
      "missing seeded reel",
    );
    assert(
      "reels: shape — _id, video_url, author{_id, profile_picture_url, is_followed_by_me}, stats, user_interactions",
      seededReel &&
        typeof seededReel.video_url === "string" &&
        seededReel.author &&
        seededReel.author._id !== undefined &&
        "profile_picture_url" in seededReel.author &&
        typeof seededReel.author.is_followed_by_me === "boolean" &&
        seededReel.stats &&
        typeof seededReel.stats.votes === "number" &&
        seededReel.user_interactions &&
        typeof seededReel.user_interactions.has_voted === "boolean",
      String(JSON.stringify(seededReel)).slice(0, 400),
    );
    assert(
      "reels: votes count surfaces from DB",
      seededReel?.stats?.votes === 42,
      `votes=${seededReel?.stats?.votes}`,
    );

    // Cursor pagination — limit=1, expect hasMore=true
    const r1 = await request("GET", "/reels", { token, query: { limit: 1 } });
    assert(
      "reels: cursor pagination — limit=1 returns hasMore=true",
      r1.body?.data?.hasMore === true && r1.body?.data?.nextCursor,
      `hasMore=${r1.body?.data?.hasMore} nextCursor=${r1.body?.data?.nextCursor}`,
    );
    if (r1.body?.data?.nextCursor) {
      const r2 = await request("GET", "/reels", {
        token,
        query: { limit: 1, cursor: r1.body.data.nextCursor },
      });
      assert(
        "reels: next page reel _id is older (different)",
        r2.body?.data?.reels?.[0] &&
          r2.body.data.reels[0]._id.toString() !==
            r1.body.data.reels[0]._id.toString(),
        `r1=${r1.body?.data?.reels?.[0]?._id} r2=${r2.body?.data?.reels?.[0]?._id}`,
      );
    }
  } finally {
    console.log(c.cyan("\n→ Cleaning up seed data"));
    await cleanup();
  }

  console.log(
    c.bold(
      `\n=== Summary: ${c.green(pass + " pass")}, ${
        fail ? c.red(fail + " fail") : "0 fail"
      } ===`,
    ),
  );
  failures.forEach((f, i) =>
    console.log(`  ${i + 1}. ${f.name} — ${f.detail || ""}`),
  );

  await mongoose.disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => {
  console.error(c.red("FATAL: " + e.message));
  console.error(e);
  try {
    const Competition = require("../src/models/Competition");
    const Reel = require("../src/models/Reel");
    await Reel.deleteMany({ caption: { $regex: TAG } });
    await Competition.deleteMany({ title: { $regex: TAG } });
  } catch (_) {}
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(2);
});
