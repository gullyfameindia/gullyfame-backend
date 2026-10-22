# QA "hello from main" — Root Cause & Fix

## What QA observed
Every endpoint (Auth, Home Screen, Categories, Trending, Champions, Notifications,
Chats, Competitions, Feed, Reels, Search) returned `hello from main`.

## Root cause
Not a backend bug. The base URL in use (Postman env or app config) was missing the
`/v1/api/` prefix that all routes are mounted under in [index.js:31](index.js#L31):

```js
app.use("/v1/api", require("./src/routes"));
```

A request to `http://<host>:<port>/auth/login` does not match any route. With the
old build it fell through to the health route `app.get("/", ...)` returning
`Hello from main`. Today it returns `404 {"error":"Not found","path":"..."}`.

## Backend status — verified
Every route file is wired correctly to its controller:

| Route prefix | File | Status |
|---|---|---|
| `/v1/api/auth` | [routes/auth.js](src/routes/auth.js) | OK |
| `/v1/api/user` | [routes/users.js](src/routes/users.js) | OK |
| `/v1/api/public` | [routes/public.js](src/routes/public.js) | OK |
| `/v1/api/chat` | [routes/chat.js](src/routes/chat.js) | OK |
| `/v1/api/notification` | [routes/notification.js](src/routes/notification.js) | OK |
| `/v1/api/competitions` | [routes/competitions.js](src/routes/competitions.js) | OK |
| `/v1/api/feed` | [routes/feed.js](src/routes/feed.js) | OK |
| `/v1/api/reels` | [routes/reels.js](src/routes/reels.js) | OK |
| `/v1/api/search` | [routes/search.js](src/routes/search.js) | OK |
| `/v1/api/admin` | [routes/adminRoutes.js](src/routes/adminRoutes.js) | OK |

Mapping each QA "Collection" to the actual endpoint:

| QA Collection | Actual endpoint | Auth required |
|---|---|---|
| Auth — Register | `POST /v1/api/auth/register` | no |
| Auth — Login | `POST /v1/api/auth/login` | no |
| Auth — Social Login | `POST /v1/api/auth/login/social` | no |
| Auth — Verify OTP | `POST /v1/api/auth/verifyOtp` | no |
| Auth — Resend OTP | `POST /v1/api/auth/resendOtp` | no |
| Auth — Forgot Password | `POST /v1/api/auth/forgot-password` | no |
| Auth — Reset Password | `PUT  /v1/api/auth/reset-password` | yes |
| Home Screen | `GET  /v1/api/user/homeScreen` | yes |
| Categories | `GET  /v1/api/user/categories?page=1&limit=50` | yes |
| Trending / Feed | `GET  /v1/api/feed/matrix?page=1&limit=5` | yes |
| Notifications | `GET  /v1/api/notification/notification?time=1&page=1&limit=10` | yes |
| Chats — List | `GET  /v1/api/chat/chatlist` | yes |
| Chats — Details | `GET  /v1/api/chat/chatDetails?chatterId=...&page=1&limit=10` | yes |
| Chats — Send | `POST /v1/api/chat/sendChat` | yes |
| Chats — React | `POST /v1/api/chat/message/:messageId/react` | yes |
| Chats — Delete | `POST /v1/api/chat/message/delete` | yes |
| Chats — Read | `PUT  /v1/api/chat/read` | yes |
| Competition — Detail | `GET  /v1/api/competitions/:competitionId` | yes |
| Competition — Leaderboard | `GET  /v1/api/competitions/:competitionId/leaderboard?page=1&limit=20` | yes |
| Competition — Reels | `GET  /v1/api/competitions/:competitionId/reels?limit=10` | yes |
| Reels — Action | `POST /v1/api/reels/:reelId/action` | yes |
| Search | `GET  /v1/api/search?q=<term>&type=<all\|users\|competitions\|reels>&page=1&limit=20` | yes |
| Public — Logo | `GET  /v1/api/public/logo` | no |
| Public — Splash | `GET  /v1/api/public/splash` | no |

## Endpoints in the Postman collection that DO NOT exist on the backend

These three URLs in [User.postman_collection.json](User.postman_collection.json)
have no matching route. They will return 404 even with the correct base URL, and
need either backend implementation or removal from the collection:

1. **`GET {{BASE_URL}}user/champaigns`** — "Champions" list. Not in
   [routes/users.js](src/routes/users.js). No `ChampionController` exists.
2. **`GET {{BASE_URL}}user/competitions`** — "My competitions" list. Not in
   [routes/users.js](src/routes/users.js). The `competitions` router only has
   detail/leaderboard/reels by `:competitionId`, no listing endpoint.
3. **`GET {{BASE_URL}}reels`** — Reels feed listing. Only
   `POST /reels/:reelId/action` exists. Reels appear inside `feed/matrix` and
   `competitions/:id/reels` but there is no standalone `GET /reels`.

**Action item:** confirm with product/dev whether these three should be
implemented or whether the mobile app should call existing endpoints instead
(e.g. `feed/matrix` for trending feed, `competitions/:id` for individual
competitions).

## Fix applied to Postman
[Dev.postman_environment.json](Dev.postman_environment.json) — `BASE_URL` was
empty, now set to `http://localhost:3552/v1/api/` (port from `.env: PORT=3552`).
With that, every existing collection URL like `{{BASE_URL}}auth/login` resolves
to `http://localhost:3552/v1/api/auth/login` — matches the route.

For staging/prod, override `BASE_URL` in a new Postman environment, e.g.
`https://api.gullyfame.com/v1/api/` (keep the trailing `/`).

## Action item for the mobile app
Whatever the app uses as its base URL constant must end with `/v1/api/` (or the
app must prepend `/v1/api` to every path). Without that prefix every request
hits the 404 handler.
