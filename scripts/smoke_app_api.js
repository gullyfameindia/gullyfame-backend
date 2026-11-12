/* eslint-disable no-console */
// Live check of every endpoint the Gully Fame mobile app calls.
//
//   cd ~/gullyfamebackend
//   node scripts/smoke_app_api.js                       # against https://api.gullyfame.com
//   node scripts/smoke_app_api.js http://127.0.0.1:3552 # straight to Node, skipping Nginx
//
// Logs in as the seed test user (mobile 9999999999, SEED_USER_MOBILE to change)
// with MASTER_OTP_LOGIN from .env. The OTP and the token are never printed.
//
// It does not change real data:
//   - reads are just reads
//   - toggles (like, save, follow, saved audio) run twice, so they end where they started
//   - create endpoints get deliberately invalid input and must reject it cleanly
//     (proves the route and its validation are alive without creating anything)
//
// A result is a FAIL when the route is missing (Express 404), the server errors
// (HTTP 5xx), the request never completes, or the reply is a crash dressed up as
// a normal error (the backend reports thrown exceptions as code 0 with the raw text).
require("dotenv").config();

const ORIGIN = (process.argv[2] || "https://api.gullyfame.com").replace(/\/+$/, "");
const BASE = `${ORIGIN}/v1/api`;
const MOBILE = process.env.SEED_USER_MOBILE || "9999999999";
const MASTER_OTP = String(process.env.MASTER_OTP_LOGIN || "").trim();
const BAD_ID = "000000000000000000000000"; // valid ObjectId that matches nothing

const c = {
  g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, d: (s) => `\x1b[2m${s}\x1b[0m`,
};

// Messages that mean the handler threw, not that it rejected input on purpose.
const CRASH = /Cannot read prop|is not a function|is not defined|Cast to ObjectId failed|E11000|ValidationError|undefined \(reading|BSON|ECONN|Unexpected token|Maximum call stack/i;

const results = [];
let token = "";

async function call(method, path, { body, auth = true, form } = {}) {
  const url = `${BASE}/${path.replace(/^\/+/, "")}`;
  const headers = { Accept: "application/json" };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  const t0 = Date.now();
  try {
    const res = await fetch(url, { method, headers, body: payload, signal: AbortSignal.timeout(30000) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) {}
    return { status: res.status, json, ms: Date.now() - t0, raw: text.slice(0, 200) };
  } catch (e) {
    return { status: 0, json: null, ms: Date.now() - t0, raw: e.name === "TimeoutError" ? "timed out after 30s" : e.message };
  }
}

/**
 * expect: "ok"     -> must succeed (code 1)
 *         "reject" -> must be refused cleanly (code 0, 4 or 5), not crash
 * shape:  optional (data) => string|null, returns a problem description
 */
async function check(area, label, method, path, { expect = "ok", shape, ...opts } = {}) {
  const r = await call(method, path, opts);
  const code = r.json && typeof r.json.code === "number" ? r.json.code : null;
  const msg = (r.json && (r.json.message || r.json.error)) || r.raw || "";
  let verdict = "PASS";
  let note = "";

  if (r.status === 0) { verdict = "FAIL"; note = `no response: ${msg}`; }
  else if (r.status >= 500) { verdict = "FAIL"; note = `server error ${r.status}`; }
  else if (r.status === 404 && r.json && r.json.error === "Not found") { verdict = "FAIL"; note = "route does not exist"; }
  else if (code === null) { verdict = "FAIL"; note = `not the {code,message,data} shape: ${String(msg).slice(0, 80)}`; }
  else if (CRASH.test(msg)) { verdict = "FAIL"; note = `handler crashed: ${String(msg).slice(0, 90)}`; }
  else if (expect === "ok" && code === 0 && /hasn't been added yet/.test(msg)) { verdict = "WARN"; note = "no content yet - add it in the admin panel"; }
  else if (expect === "ok" && code !== 1) { verdict = "FAIL"; note = `expected success, got code ${code}: ${msg}`; }
  else if (expect === "reject" && code === 1) { verdict = "WARN"; note = "accepted input that should have been refused"; }
  else if (expect === "reject") { note = `refused as expected: ${msg}`; }

  if (verdict === "PASS" && expect === "ok" && shape) {
    const problem = shape(r.json.data);
    if (problem) { verdict = "WARN"; note = problem; }
  }

  results.push({ area, label, method, path: path.replace(/[0-9a-f]{24}/g, ":id"), status: r.status, code, ms: r.ms, verdict, note });
  const tag = verdict === "PASS" ? c.g("PASS") : verdict === "WARN" ? c.y("WARN") : c.r("FAIL");
  console.log(`${tag} ${method.padEnd(6)} ${path.replace(/[0-9a-f]{24}/g, ":id").padEnd(44)} ${String(r.status).padStart(3)} ${String(r.ms).padStart(5)}ms ${c.d(note)}`);
  return r.json ? r.json.data : null;
}

const has = (obj, keys) => keys.filter((k) => !(obj && k in obj));
const missing = (what, keys) => (keys.length ? `${what} missing: ${keys.join(", ")}` : null);

async function login() {
  if (!MASTER_OTP) throw new Error("MASTER_OTP_LOGIN is not set in .env - run this from ~/gullyfamebackend");
  const a = await call("POST", "auth/login", { auth: false, body: { userId: MOBILE, viaPassword: false } });
  if (!a.json || a.json.code !== 1 || !a.json.data || !a.json.data.txnId) {
    throw new Error(`login failed: HTTP ${a.status} ${a.json ? a.json.message : a.raw}`);
  }
  const b = await call("POST", "auth/verifyOtp", { auth: false, body: { txnId: a.json.data.txnId, otp: MASTER_OTP } });
  if (!b.json || b.json.code !== 1 || !b.json.data || !b.json.data.token) {
    throw new Error(`verifyOtp failed: HTTP ${b.status} ${b.json ? b.json.message : b.raw}`);
  }
  token = b.json.data.token;
  results.push({ area: "Auth", label: "login + verifyOtp", method: "POST", path: "auth/login, auth/verifyOtp", status: 200, code: 1, ms: a.ms + b.ms, verdict: "PASS", note: "" });
  console.log(`${c.g("PASS")} POST   auth/login + auth/verifyOtp ${c.d("(logged in as the seed test user)")}`);
}

async function main() {
  console.log(c.b(`\n=== Gully Fame app API check -> ${BASE} ===\n`));

  // ---------------------------------------------------------------- health
  const h = await fetch(`${ORIGIN}/`).then((r) => r.text()).catch((e) => `ERROR ${e.message}`);
  console.log(`health: ${h.slice(0, 60)}\n`);

  // ---------------------------------------------------------------- public (no login)
  console.log(c.b("-- Public, no login"));
  await check("Public", "logo", "GET", "public/logo", { auth: false, shape: (d) => (d ? null : "no logo uploaded yet - the app uses its built-in one") });
  await check("Public", "splash", "GET", "public/splash", { auth: false, shape: (d) => (Array.isArray(d) && d.length ? null : "no splash images uploaded yet") });
  const audioPage = await check("Public", "music library", "GET", "public/audio?sort=trending&limit=5", {
    auth: false, shape: (d) => missing("audio list", has(d, ["audios", "hasMore", "total"])) ||
      (d.audios[0] && missing("track", has(d.audios[0], ["url", "title", "duration"]))),
  });
  await check("Public", "filters", "GET", "public/filters", { auth: false });
  await check("Public", "stickers", "GET", "public/stickers", { auth: false });
  await check("Public", "sound effects", "GET", "public/soundfx", { auth: false });
  for (const p of ["termAndCondition", "aboutUs", "privacyPolicy", "competitionRules"]) {
    await check("Public", p, "GET", `public/${p}`, { auth: false, shape: (d) => (typeof d === "string" ? null : "app expects a string here") });
  }
  await check("Public", "FAQs", "GET", "admin/faqs?isActive=true&limit=100", { auth: false });
  await check("Public", "contact us", "GET", "admin/contactUs", { auth: false });

  // ---------------------------------------------------------------- auth (no accounts touched)
  console.log(c.b("\n-- Auth"));
  await login();
  await check("Auth", "forgot password, unknown user", "POST", "auth/forgot-password", { auth: false, expect: "reject", body: { userId: "nobody-here@example.invalid" } });
  await check("Auth", "reset code, bad txn", "POST", "auth/forgot-password/verify-otp", { auth: false, expect: "reject", body: { txnId: "not-a-real-txn", otp: 123456 } });
  await check("Auth", "reset with bad token", "POST", "auth/forgot-password/reset", { auth: false, expect: "reject", body: { resetToken: "bad", password: "irrelevant123" } });
  await check("Auth", "social login, no provider id", "POST", "auth/login/social", { auth: false, expect: "reject", body: {} });

  // ---------------------------------------------------------------- profile
  console.log(c.b("\n-- Profile"));
  const me = await check("Profile", "my profile", "GET", "user/profile", {
    shape: (d) => missing("profile", has(d, ["_id", "profileImage", "notificationAllowed", "followersCount", "followingCount"])),
  });
  await check("Profile", "edit profile (no changes)", "PUT", "user/profile", { body: {}, shape: (d) => missing("edit response", has(d, ["user"])) });
  if (me) {
    await check("Profile", "notification setting (kept as is)", "GET", `user/notifications/switch?enabled=${me.notificationAllowed ? "true" : "false"}`);
  }
  await check("Profile", "progress", "GET", "user/progress");
  await check("Profile", "daily mission", "GET", "user/daily-mission");
  await check("Profile", "my followers", "GET", "user/followers");
  await check("Profile", "my following", "GET", "user/following");
  const pageShape = (d) => missing("page", has(d, ["reels", "nextCursor", "hasMore"]));
  await check("Profile", "my saved reels", "GET", "user/reels/saved?limit=10", { shape: pageShape });
  await check("Profile", "my liked reels", "GET", "user/reels/liked?limit=10", { shape: pageShape });
  await check("Profile", "profile views (30 days)", "GET", "user/insights?days=30", {
    shape: (d) => missing("insights", has(d, ["days", "views", "uniqueViewers", "daily"])),
  });
  await check("Profile", "KYC status", "GET", "user/kyc");
  await check("Profile", "KYC submit, no files", "POST", "user/kyc", { expect: "reject", body: {} });

  // ---------------------------------------------------------------- home + discovery
  console.log(c.b("\n-- Home and discovery"));
  const home = await check("Home", "home screen", "GET", "user/homeScreen", {
    shape: (d) => missing("home", has(d, ["banners", "categories", "trending", "liveCompetitions", "upcomingCompetitions", "pastCompetitions", "topCompetitors", "dailyMission"])),
  });
  await check("Home", "categories", "GET", "user/categories?page=1&limit=50");
  await check("Home", "champions", "GET", "user/champions?page=1&limit=20");
  const matrix = await check("Home", "competition matrix", "GET", "feed/matrix?page=1&limit=5");
  await check("Home", "search all", "GET", "search?q=a&type=all");
  await check("Home", "search users", "GET", "search?q=a&type=users&page=1&limit=10");
  await check("Home", "search reels", "GET", "search?q=a&type=reels&page=1&limit=10");
  await check("Home", "search competitions", "GET", "search?q=a&type=competitions&page=1&limit=10");

  // ---------------------------------------------------------------- reels
  console.log(c.b("\n-- Reels"));
  const feed = await check("Reels", "feed", "GET", "reels?limit=10", {
    shape: (d) => {
      const p = missing("feed", has(d, ["reels", "nextCursor", "hasMore"]));
      if (p || !d.reels.length) return p || "feed is empty (nothing to check the reel fields against)";
      const r0 = d.reels[0];
      const gaps = [];
      if (!(r0.music && "url" in r0.music)) gaps.push("music.url");
      if (!(r0.stats && "likes" in r0.stats)) gaps.push("stats.likes");
      if (!(r0.user_interactions && "is_liked" in r0.user_interactions)) gaps.push("user_interactions.is_liked");
      return gaps.length ? `reel missing ${gaps.join(", ")}` : null;
    },
  });
  const reels = (feed && feed.reels) || [];
  const someReel = reels[0];
  const myId = me && me._id;
  const otherUser = reels.map((r) => r.author && r.author._id).find((id) => id && id !== myId);

  if (someReel) {
    const author = someReel.author && someReel.author._id;
    const authorReels = await call("GET", `reels?limit=20&author=${author}`);
    const list = (authorReels.json && authorReels.json.data && authorReels.json.data.reels) || [];
    const strangers = list.filter((r) => r.author && r.author._id !== author).length;
    results.push({ area: "Reels", label: "feed filtered by author (profile grid)", method: "GET", path: "reels?author=:id", status: authorReels.status, code: authorReels.json ? authorReels.json.code : null, ms: authorReels.ms,
      verdict: strangers ? "WARN" : "PASS", note: strangers ? `${strangers} of ${list.length} reels belong to other users - the author filter is ignored` : "" });
    console.log(`${strangers ? c.y("WARN") : c.g("PASS")} GET    reels?author=:id ${c.d(strangers ? `${strangers}/${list.length} reels from other users - author filter ignored` : "")}`);

    await check("Reels", "comments", "GET", `reels/${someReel._id}/comments?page=1&limit=20`);
    await check("Reels", "add comment, empty", "POST", `reels/${someReel._id}/comments`, { expect: "reject", body: { text: "" } });
    await check("Reels", "report, bad reason", "POST", `reels/${someReel._id}/report`, { expect: "reject", body: { reason: "not-a-reason" } });
    // Toggles run twice so nothing changes.
    for (const action of ["like", "save"]) {
      await check("Reels", `${action} (on)`, "POST", `reels/${someReel._id}/action`, { body: { action_type: action } });
      await check("Reels", `${action} (back off)`, "POST", `reels/${someReel._id}/action`, { body: { action_type: action } });
    }
  } else {
    console.log(c.y("     (feed is empty - reel-specific checks skipped)"));
  }
  await check("Reels", "delete comment, bad id", "DELETE", `reels/comments/${BAD_ID}`, { expect: "reject" });
  await check("Reels", "like comment, bad id", "POST", `reels/comments/${BAD_ID}/like`, { expect: "reject", body: {} });
  await check("Reels", "report, unknown reel", "POST", `reels/${BAD_ID}/report`, { expect: "reject", body: { reason: "spam" } });
  await check("Reels", "delete reel, bad id", "DELETE", `reels/${BAD_ID}`, { expect: "reject" });
  await check("Reels", "tip, zero amount", "POST", `reels/${BAD_ID}/tip`, { expect: "reject", body: { amount: 0 } });
  await check("Reels", "upload url, no file", "POST", "reels/upload-url", { expect: "reject", body: {} });
  await check("Reels", "upload url", "POST", "reels/upload-url", {
    body: { fileName: "smoke.jpg", fileType: "image/jpeg" },
    shape: (d) => missing("upload url", has(d, ["uploadUrl", "fileUrl", "key"])) || (String(d.key).startsWith("media/reels/") ? null : `key not under media/reels/: ${d.key}`),
  });
  await check("Reels", "publish, no video", "POST", "reels/publish", { expect: "reject", body: { caption: "smoke" } });
  await check("Reels", "latest draft", "GET", "reels/draft");
  await check("Reels", "auto caption, no media", "POST", "reels/auto-caption", { expect: "reject", body: {} });

  // ---------------------------------------------------------------- music
  console.log(c.b("\n-- Music"));
  await check("Music", "my saved tracks", "GET", "user/audio/saved");
  const firstTrack = audioPage && audioPage.audios && audioPage.audios[0];
  if (firstTrack) {
    await check("Music", "save track (on)", "POST", `user/audio/${firstTrack._id}/save`, { body: {} });
    await check("Music", "save track (back off)", "POST", `user/audio/${firstTrack._id}/save`, { body: {} });
    await check("Music", "one sound", "GET", `public/audio/${firstTrack._id}`, { auth: false });
    await check("Music", "reels using a sound", "GET", `public/audio/${firstTrack._id}/reels`, { auth: false });
  } else {
    console.log(c.y("     (music library is empty - upload a track in the admin panel to test these)"));
  }

  // ---------------------------------------------------------------- social
  console.log(c.b("\n-- Follow"));
  if (otherUser) {
    await check("Follow", "follow (on)", "POST", `user/${otherUser}/follow`, { body: {} });
    await check("Follow", "follow (back off)", "POST", `user/${otherUser}/follow`, { body: {} });
    await check("Follow", "their public profile", "GET", `user/${otherUser}`, {
      shape: (d) => {
        const leaked = ["email", "mobile", "dob", "device_token", "password", "location"].filter((k) => k in d);
        if (leaked.length) return `PRIVATE FIELDS EXPOSED: ${leaked.join(", ")}`;
        return missing("public profile", has(d, ["_id", "username", "followersCount", "followingCount", "reelsCount", "isFollowedByMe"]));
      },
    });
    await check("Follow", "their followers", "GET", `user/${otherUser}/followers`);
    await check("Follow", "their following", "GET", `user/${otherUser}/following`);
  } else {
    console.log(c.y("     (no reels from another user in the feed - follow checks skipped)"));
  }

  // ---------------------------------------------------------------- competitions
  await check("Follow", "public profile, unknown user", "GET", `user/${BAD_ID}`, { expect: "reject" });

  console.log(c.b("\n-- Competitions"));
  await check("Competitions", "my competitions", "GET", "user/competitions?page=1&limit=10");
  const compId =
    (home && [...(home.liveCompetitions || []), ...(home.upcomingCompetitions || []), ...(home.pastCompetitions || [])].map((x) => x.id)[0]) ||
    (matrix && matrix.competitions && matrix.competitions[0] && matrix.competitions[0]._id);
  if (compId) {
    await check("Competitions", "details", "GET", `competitions/${compId}`);
    await check("Competitions", "leaderboard", "GET", `competitions/${compId}/leaderboard?page=1&limit=20`);
    await check("Competitions", "entries", "GET", `competitions/${compId}/reels?limit=10`);
    await check("Competitions", "invite, nobody", "POST", `competitions/${compId}/invite`, { expect: "reject", body: {} });
  } else {
    console.log(c.y("     (no competitions in the database - detail checks skipped)"));
  }
  await check("Competitions", "details, bad id", "GET", `competitions/${BAD_ID}`, { expect: "reject" });
  await check("Competitions", "join, bad id", "POST", `competitions/${BAD_ID}/join`, { expect: "reject", body: {} });

  // ---------------------------------------------------------------- chat
  console.log(c.b("\n-- Chat"));
  const chats = await check("Chat", "chat list", "GET", "chat/chatlist");
  await check("Chat", "archived chats", "GET", "chat/chatlist?view=archived");
  const chatter = chats && chats.chatlist && chats.chatlist[0] && (chats.chatlist[0].chatterId || chats.chatlist[0]._id);
  if (chatter) await check("Chat", "conversation", "GET", `chat/chatDetails?chatterId=${chatter}&page=1&limit=30`);
  await check("Chat", "send, empty", "POST", "chat/sendChat", { expect: "reject", body: {} });
  await check("Chat", "react, no emoji", "POST", `chat/message/${BAD_ID}/react`, { expect: "reject", body: {} });
  await check("Chat", "delete, no ids", "POST", "chat/message/delete", { expect: "reject", body: {} });
  await check("Chat", "mark read, no sender", "PUT", "chat/read", { expect: "reject", body: {} });
  await check("Chat", "archive, no chat", "POST", "chat/archive", { expect: "reject", body: {} });

  // ---------------------------------------------------------------- notifications
  console.log(c.b("\n-- Notifications"));
  await check("Notifications", "list", "GET", "notification/notification?time=1&page=1&limit=10");
  await check("Notifications", "mark one read, bad id", "PUT", `notification/${BAD_ID}/read`, { expect: "reject", body: {} });
  await check("Notifications", "delete one, bad id", "DELETE", `notification/${BAD_ID}`, { expect: "reject" });

  // ---------------------------------------------------------------- wallet
  console.log(c.b("\n-- Wallet"));
  await check("Wallet", "balance + history", "GET", "user/wallet?page=1&limit=20");
  await check("Wallet", "recharge, zero", "POST", "user/wallet/recharge", { expect: "reject", body: { amount: 0 } });
  await check("Wallet", "verify, no payment", "POST", "user/wallet/recharge/verify", { expect: "reject", body: {} });
  await check("Wallet", "recharge status, unknown order", "GET", "user/wallet/recharge/order_doesnotexist", { expect: "reject" });

  // ---------------------------------------------------------------- summary
  const n = (v) => results.filter((r) => r.verdict === v).length;
  console.log(c.b(`\n=== ${results.length} checks: ${c.g(n("PASS") + " pass")}, ${c.y(n("WARN") + " warn")}, ${c.r(n("FAIL") + " fail")} ===`));
  const slow = results.filter((r) => r.ms > 3000);
  if (slow.length) console.log(c.y(`slow (>3s): ${slow.map((r) => `${r.path} ${r.ms}ms`).join(", ")}`));
  for (const v of ["FAIL", "WARN"]) {
    const rows = results.filter((r) => r.verdict === v);
    if (!rows.length) continue;
    console.log(c.b(`\n${v}:`));
    rows.forEach((r) => console.log(`  ${r.method} ${r.path}  -  ${r.note}`));
  }
  console.log("");
  process.exit(n("FAIL") ? 1 : 0);
}

main().catch((e) => {
  console.error(c.r(`\nFATAL: ${e.message}\n`));
  process.exit(2);
});
