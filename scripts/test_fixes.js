/* eslint-disable no-console */
// Live check of the Critical/High fixes against your running local server
// and real database. Creates temporary records and deletes them at the end.
//
//   1. restart the server so it runs the new code (npm start)
//   2. in a second terminal:  node scripts/test_fixes.js
//
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
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

let pass = 0;
let fail = 0;
function assert(name, ok, detail) {
  if (ok) {
    pass++;
    console.log(`  ${c.green("PASS")} ${name}`);
  } else {
    fail++;
    console.log(`  ${c.red("FAIL")} ${name} — ${detail || ""}`);
  }
}

function request(method, path, { token, body } = {}) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(BASE + path);
    const req = http.request(
      {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        timeout: 5000,
        headers: {
          ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (ch) => (raw += ch));
        res.on("end", () => {
          let json = null;
          try { json = JSON.parse(raw); } catch (_) {}
          resolve({ status: res.statusCode, body: json, raw });
        });
      },
    );
    req.on("timeout", () => { req.destroy(); resolve({ status: -1, body: null, raw: "TIMEOUT (request hung)" }); });
    req.on("error", (e) => resolve({ status: -1, body: null, raw: e.message }));
    if (data) req.write(data);
    req.end();
  });
}
const msg = (r) => (r.body && r.body.message) || r.raw.slice(0, 120);

async function main() {
  console.log(c.bold(c.cyan("\n=== Testing Critical/High fixes against " + BASE + " ===\n")));

  const ping = await request("GET", "/public/aboutUs");
  if (ping.status === -1) {
    console.log(c.red(`Server not reachable on port ${PORT}: ${ping.raw}\nStart it with "npm start" first.`));
    process.exit(1);
  }

  await mongoose.connect(process.env.LOCAL_MONGO_DB);
  const User = require("../src/models/User");
  const Admin = require("../src/models/Admin");
  const Category = require("../src/models/Catagory");

  const tag = "fixtest" + Date.now();
  const created = { users: [], admins: [], categories: [] };

  try {
    // temporary records
    const admin = await Admin.create({ email: `${tag}-admin@test.local`, password: "x", isActive: true });
    created.admins.push(admin._id);
    const user = await User.create({ firstName: "Fix", lastName: "Test", email: `${tag}-a@test.local`, mobile: "0000000001", password: "$2a$10$keepthishashunchanged", notificationAllowed: true });
    const other = await User.create({ firstName: "Other", email: `${tag}-b@test.local`, mobile: "0000000002" });
    created.users.push(user._id, other._id);
    const catA = await Category.create({ name: `${tag}-A`, isActive: true });
    const catB = await Category.create({ name: `${tag}-B`, isActive: true });
    created.categories.push(catA._id, catB._id);

    const adminToken = jwt.sign({ adminId: admin._id, isAdmin: true }, JWTSECRET);
    const userToken = jwt.sign({ userId: user._id }, JWTSECRET);

    console.log(c.bold("#1 GET /admin/categories/:id"));
    let r = await request("GET", `/admin/categories/${catA._id}`, { token: adminToken });
    assert("returns the category to an admin", r.status === 200 && r.body.data && r.body.data.name === catA.name, `${r.status} ${msg(r)}`);
    r = await request("GET", `/admin/categories/abc`, { token: adminToken });
    assert("malformed id → 400", r.status === 400, `${r.status} ${msg(r)}`);
    r = await request("GET", `/admin/categories/${catA._id}`);
    assert("no token → 401", r.status === 401, `${r.status} ${msg(r)}`);

    console.log(c.bold("#2 PATCH /admin/categories/:id"));
    r = await request("PATCH", `/admin/categories/${catA._id}`, { token: adminToken });
    let dbCat = await Category.findById(catA._id).lean();
    assert("toggle with no body → inactive", r.status === 200 && dbCat.isActive === false, `${r.status} ${msg(r)} isActive=${dbCat.isActive}`);
    r = await request("PATCH", `/admin/categories/${catA._id}`, { token: adminToken, body: { isActive: true } });
    dbCat = await Category.findById(catA._id).lean();
    assert("{isActive:true} → active", r.status === 200 && dbCat.isActive === true, `${r.status} ${msg(r)}`);

    console.log(c.bold("#3 GET /user/notifications/switch"));
    await request("GET", `/user/notifications/switch`, { token: userToken });
    let u = await User.findById(user._id).lean();
    assert("1st call turns OFF", u.notificationAllowed === false, `value=${u.notificationAllowed}`);
    await request("GET", `/user/notifications/switch`, { token: userToken });
    u = await User.findById(user._id).lean();
    assert("2nd call turns back ON", u.notificationAllowed === true, `value=${u.notificationAllowed}`);

    console.log(c.bold("#5 POST /admin/register"));
    r = await request("POST", `/admin/register`, { body: { email: `${tag}-evil@test.local`, password: "x" } });
    let evil = await Admin.findOne({ email: `${tag}-evil@test.local` });
    if (evil) created.admins.push(evil._id);
    assert("no token → 401, no admin created", r.status === 401 && !evil, `${r.status} ${msg(r)} created=${!!evil}`);
    r = await request("POST", `/admin/register`, { token: userToken, body: { email: `${tag}-evil2@test.local`, password: "x" } });
    evil = await Admin.findOne({ email: `${tag}-evil2@test.local` });
    if (evil) created.admins.push(evil._id);
    assert("user token → 401", r.status === 401 && !evil, `${r.status} ${msg(r)}`);
    r = await request("POST", `/admin/register`, { token: adminToken, body: { email: `${tag}-second@test.local`, password: "pw123456" } });
    const second = await Admin.findOne({ email: `${tag}-second@test.local` });
    if (second) created.admins.push(second._id);
    assert("admin token → creates admin", r.status === 200 && !!second, `${r.status} ${msg(r)}`);

    console.log(c.bold("#6 DELETE /admin/categories/:id"));
    r = await request("DELETE", `/admin/categories/${catB._id}`);
    assert("no token → 401, category kept", r.status === 401 && !!(await Category.findById(catB._id)), `${r.status} ${msg(r)}`);
    r = await request("DELETE", `/admin/categories/${catB._id}`, { token: userToken });
    assert("user token → 401", r.status === 401 && !!(await Category.findById(catB._id)), `${r.status} ${msg(r)}`);
    r = await request("DELETE", `/admin/categories/${catB._id}`, { token: adminToken });
    assert("admin token → deleted", r.status === 200 && !(await Category.findById(catB._id)), `${r.status} ${msg(r)}`);

    console.log(c.bold("#7 POST /public/logo"));
    r = await request("POST", `/public/logo`, { body: {} });
    assert("no token → 401", r.status === 401, `${r.status} ${msg(r)}`);
    r = await request("GET", `/public/logo`);
    assert("GET stays public", r.status === 200, `${r.status} ${msg(r)}`);

    console.log(c.bold("#8 PUT /user/profile"));
    r = await request("PUT", `/user/profile`, { token: userToken, body: { firstName: "Renamed", xp: 999999, level: 99, isDeleted: true, password: "plain" } });
    u = await User.findById(user._id).lean();
    assert("firstName updated", u.firstName === "Renamed", `${r.status} ${msg(r)}`);
    assert("xp / level / isDeleted unchanged", u.xp !== 999999 && u.level !== 99 && u.isDeleted !== true, `xp=${u.xp} level=${u.level} isDeleted=${u.isDeleted}`);
    assert("password unchanged", u.password === "$2a$10$keepthishashunchanged", `password changed`);
    r = await request("PUT", `/user/profile`, { token: userToken, body: { email: `${tag}-b@test.local` } });
    assert("can't take another user's email", r.status === 400, `${r.status} ${msg(r)}`);

    console.log(c.bold("Extra: bad id no longer hangs/crashes the server"));
    r = await request("GET", `/admin/banners/abc`);
    assert("GET /admin/banners/abc → 400", r.status === 400, `${r.status} ${msg(r)}`);
    r = await request("GET", "/public/aboutUs");
    assert("server still up afterwards", r.status !== -1, r.raw);

    console.log(c.bold("\n#4 (profile photo) needs a real file upload to S3 — check it in Postman:"));
    console.log("  PUT /user/profile, Body → form-data, key profileImage (type File), then GET /user/profile → profileImage has the URL");
  } finally {
    await User.deleteMany({ _id: { $in: created.users } });
    await Admin.deleteMany({ _id: { $in: created.admins } });
    await Category.deleteMany({ _id: { $in: created.categories } });
    await mongoose.disconnect();
    console.log(c.cyan("\nTemporary test records removed."));
  }

  console.log(c.bold(`\nResult: ${c.green(pass + " passed")}, ${fail ? c.red(fail + " failed") : "0 failed"}\n`));
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => {
  console.error(c.red("FATAL: " + e.message));
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
