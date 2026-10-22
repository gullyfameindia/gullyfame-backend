/* eslint-disable no-console */
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3552;
const BASE = `http://127.0.0.1:${PORT}/v1/api`;
const JWTSECRET = process.env.JWTSECRET;

// ANSI helpers
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

async function pickActiveUser() {
  const User = require("../src/models/User");
  // Pick any active user with at least firstName set
  const user = await User.findOne({
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();
  if (!user) throw new Error("No active user found in DB");
  return user;
}

function mintToken(userId) {
  return jwt.sign({ userId: userId.toString() }, JWTSECRET);
}

async function waitForServer(maxMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await request("GET", "/__noop__"); // any path, just to see if server responds
      if (res.status) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  console.log(c.bold(c.cyan("\n=== E2E test: new endpoints ===\n")));

  // 1. Connect to DB independently to find a user and mint a token
  await mongoose.connect(process.env.LOCAL_MONGO_DB);
  console.log(c.cyan("→ Mongo connected"));

  const user = await pickActiveUser();
  console.log(
    c.cyan(
      `→ Test user: ${user._id} (${user.firstName || ""} ${
        user.lastName || ""
      } / ${user.email || user.mobile || "no contact"})`,
    ),
  );
  const token = mintToken(user._id);
  console.log(c.cyan(`→ Token minted (len=${token.length})`));

  // 2. Wait for server
  const up = await waitForServer();
  if (!up) {
    console.log(c.red("Server not reachable on " + BASE));
    process.exit(2);
  }
  console.log(c.cyan("→ Server reachable\n"));

  // ===== Champions =====
  console.log(c.bold("\n[1] GET /user/champaigns"));
  {
    // Auth required
    const noAuth = await request("GET", "/user/champaigns");
    assert(
      "rejects missing auth (code=3 / 401)",
      noAuth.body && noAuth.body.code === 3,
      `got status=${noAuth.status} code=${noAuth.body?.code}`,
    );

    // Happy path
    const r = await request("GET", "/user/champaigns", {
      token,
      query: { page: 1, limit: 5 },
    });
    assert("status 200", r.status === 200, `status=${r.status}`);
    assert(
      "code === 1",
      r.body && r.body.code === 1,
      `code=${r.body?.code} msg=${r.body?.message}`,
    );
    assert(
      "data.champions is array",
      Array.isArray(r.body?.data?.champions),
      `data=${JSON.stringify(r.body?.data).slice(0, 200)}`,
    );
    assert(
      "data.currentPage === 1",
      r.body?.data?.currentPage === 1,
      `currentPage=${r.body?.data?.currentPage}`,
    );
    assert(
      "data has hasMore boolean",
      typeof r.body?.data?.hasMore === "boolean",
      `hasMore=${r.body?.data?.hasMore}`,
    );

    if (r.body?.data?.champions?.length > 0) {
      const ch = r.body.data.champions[0];
      assert(
        "champion shape: {id, name, profilePictureUrl, totalVotes, totalReels, rank}",
        ch.id !== undefined &&
          typeof ch.name === "string" &&
          "profilePictureUrl" in ch &&
          typeof ch.totalVotes === "number" &&
          typeof ch.totalReels === "number" &&
          typeof ch.rank === "number",
        JSON.stringify(ch),
      );
      assert(
        "first champion rank === 1",
        ch.rank === 1,
        `rank=${ch.rank}`,
      );
    } else {
      console.log(
        c.yellow("  (champions list empty — shape assertion skipped)"),
      );
    }
  }

  // ===== My Competitions =====
  console.log(c.bold("\n[2] GET /user/competitions"));
  {
    const noAuth = await request("GET", "/user/competitions");
    assert(
      "rejects missing auth (code=3)",
      noAuth.body && noAuth.body.code === 3,
      `got code=${noAuth.body?.code}`,
    );

    const r = await request("GET", "/user/competitions", {
      token,
      query: { page: 1, limit: 10 },
    });
    assert("status 200", r.status === 200, `status=${r.status}`);
    assert(
      "code === 1",
      r.body && r.body.code === 1,
      `code=${r.body?.code} msg=${r.body?.message}`,
    );
    assert(
      "data.competitions is array",
      Array.isArray(r.body?.data?.competitions),
      `data=${JSON.stringify(r.body?.data).slice(0, 200)}`,
    );
    assert(
      "data.total is number",
      typeof r.body?.data?.total === "number",
      `total=${r.body?.data?.total}`,
    );

    if (r.body?.data?.competitions?.length > 0) {
      const comp = r.body.data.competitions[0];
      assert(
        "competition shape: {_id, title, status, prizePool, startDate, endDate, participation}",
        comp._id !== undefined &&
          typeof comp.title === "string" &&
          typeof comp.status === "string" &&
          typeof comp.prizePool === "number" &&
          comp.startDate !== undefined &&
          comp.endDate !== undefined &&
          ["joined", "submitted"].includes(comp.participation),
        JSON.stringify(comp),
      );
    } else {
      console.log(
        c.yellow(
          "  (user has no competitions — empty result is valid; shape skipped)",
        ),
      );
    }
  }

  // ===== Reels listing =====
  console.log(c.bold("\n[3] GET /reels"));
  {
    const noAuth = await request("GET", "/reels");
    assert(
      "rejects missing auth (code=3)",
      noAuth.body && noAuth.body.code === 3,
      `got code=${noAuth.body?.code}`,
    );

    const r = await request("GET", "/reels", {
      token,
      query: { limit: 5 },
    });
    assert("status 200", r.status === 200, `status=${r.status}`);
    assert(
      "code === 1",
      r.body && r.body.code === 1,
      `code=${r.body?.code} msg=${r.body?.message}`,
    );
    assert(
      "data.reels is array",
      Array.isArray(r.body?.data?.reels),
      `data=${JSON.stringify(r.body?.data).slice(0, 200)}`,
    );
    assert(
      "data has hasMore boolean",
      typeof r.body?.data?.hasMore === "boolean",
      `hasMore=${r.body?.data?.hasMore}`,
    );

    if (r.body?.data?.reels?.length > 0) {
      const reel = r.body.data.reels[0];
      assert(
        "reel shape: {_id, video_url, author, stats, user_interactions}",
        reel._id !== undefined &&
          typeof reel.video_url === "string" &&
          typeof reel.author === "object" &&
          typeof reel.stats === "object" &&
          typeof reel.user_interactions === "object",
        JSON.stringify(reel).slice(0, 300),
      );
      assert(
        "author has _id, profile_picture_url, is_followed_by_me",
        reel.author._id !== undefined &&
          "profile_picture_url" in reel.author &&
          typeof reel.author.is_followed_by_me === "boolean",
        JSON.stringify(reel.author),
      );

      // Cursor pagination check — request next page
      if (r.body.data.hasMore && r.body.data.nextCursor) {
        const r2 = await request("GET", "/reels", {
          token,
          query: { limit: 5, cursor: r.body.data.nextCursor },
        });
        assert(
          "cursor pagination: returns array",
          Array.isArray(r2.body?.data?.reels),
          `r2.code=${r2.body?.code}`,
        );
        if (Array.isArray(r2.body?.data?.reels) && r2.body.data.reels.length > 0) {
          assert(
            "second page reel _id !== first page last reel _id",
            r2.body.data.reels[0]._id.toString() !==
              r.body.data.reels[r.body.data.reels.length - 1]._id.toString(),
            "first page last == second page first",
          );
        }
      } else {
        console.log(
          c.yellow("  (only one page of reels available — cursor test skipped)"),
        );
      }
    } else {
      console.log(c.yellow("  (no reels in DB — shape assertion skipped)"));
    }

    // Invalid cursor must not crash
    const rBadCursor = await request("GET", "/reels", {
      token,
      query: { limit: 3, cursor: "not-a-valid-objectid" },
    });
    assert(
      "invalid cursor handled gracefully (code=1)",
      rBadCursor.body && rBadCursor.body.code === 1,
      `code=${rBadCursor.body?.code} msg=${rBadCursor.body?.message}`,
    );
  }

  // ===== Summary =====
  console.log(c.bold(`\n=== Summary: ${c.green(pass + " pass")}, ${fail ? c.red(fail + " fail") : "0 fail"} ===`));
  if (fail) {
    failures.forEach((f, i) =>
      console.log(`  ${i + 1}. ${f.name} — ${f.detail || ""}`),
    );
  }

  await mongoose.disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => {
  console.error(c.red("FATAL: " + e.message));
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(2);
});
