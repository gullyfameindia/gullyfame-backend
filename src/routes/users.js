const userRouter = require("express").Router();
const UserController = require("../controllers/UserController");
const HomeScreenController = require("../controllers/HomeScreenController");
const CategoryController = require("../controllers/CategoryController");
const ChampionController = require("../controllers/ChampionController");
const CompetitionController = require("../controllers/CompetitionController");
const KYCController = require("../controllers/KYCController");
const AudioController = require("../controllers/AudioController");
const WalletController = require("../controllers/WalletController");
const GamificationController = require("../controllers/GamificationController");
const ErrorHandlerMiddleware = require("../middlewares/ErrorHandlerMiddleware");
const ResponseMiddleware = require("../middlewares/ResponseMiddleware");
const AuthMiddleware = require("../middlewares/AuthMiddleware");
const UsersValidator = require("../validators/UsersValidator");

userRouter.get(
  "/profile",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().getDetails),
  ResponseMiddleware,
);

/**
 * Edit
 */
userRouter.put(
  "/profile",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().editUser),
  ResponseMiddleware,
);

/**
 * Notifications
 */

userRouter.get(
  "/notifications/switch",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().activateDeactivateNotification),
  ResponseMiddleware,
);

// userRouter.get(
//   "/notifications",
//   AuthMiddleware().verifyUserToken,
//   ErrorHandlerMiddleware(UserController().notifications),
//   ResponseMiddleware
// );

/**
 * Home Screen
 */
userRouter.get(
  "/homeScreen",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(HomeScreenController().homeScreen),
  ResponseMiddleware,
);

/**
 * Categories
 */
userRouter.get(
  "/categories",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(CategoryController().userList),
  ResponseMiddleware,
);

/**
 * Champions — leaderboard of top users by total reel votes
 * Note: route name kept as `champaigns` to match the existing Postman collection.
 */
userRouter.get(
  "/champaigns",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ChampionController().list),
  ResponseMiddleware,
);

userRouter.get(
  "/champions",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ChampionController().list),
  ResponseMiddleware,
);

/**
 * My Competitions — competitions the authenticated user has joined or
 * submitted a reel to.
 */
userRouter.get(
  "/competitions",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(CompetitionController().getMine),
  ResponseMiddleware,
);

/**
 * KYC
 */
userRouter.post(
  "/kyc",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(KYCController().submitKYC),
  ResponseMiddleware,
);

userRouter.get(
  "/kyc",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(KYCController().getMyKYC),
  ResponseMiddleware,
);

/**
 * Audio library — save/unsave (toggle) + saved list
 */
userRouter.post(
  "/audio/:audioId/save",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(AudioController().saveToggle),
  ResponseMiddleware,
);

// Original sounds this user created from their own reels (profile tab).
userRouter.get(
  "/audio/original",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(AudioController().myOriginalSounds),
  ResponseMiddleware,
);

userRouter.get(
  "/audio/saved",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(AudioController().getSaved),
  ResponseMiddleware,
);

/**
 * Follow / unfollow (toggle)
 */
userRouter.post(
  "/:userId/follow",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().follow),
  ResponseMiddleware,
);

/**
 * Followers / following lists — ?page=1&limit=20&search=
 *   GET /user/followers            → my followers
 *   GET /user/following            → who I follow
 *   GET /user/:userId/followers    → another user's followers
 *   GET /user/:userId/following    → who another user follows
 */
userRouter.get(
  "/followers",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().followers),
  ResponseMiddleware,
);

userRouter.get(
  "/following",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().following),
  ResponseMiddleware,
);

userRouter.get(
  "/:userId/followers",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().followers),
  ResponseMiddleware,
);

userRouter.get(
  "/:userId/following",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().following),
  ResponseMiddleware,
);

/**
 * Wallet — recharge goes through Razorpay:
 *   1. POST /wallet/recharge         → creates a Razorpay order
 *   2. App opens Razorpay Checkout with the returned keyId/orderId
 *   3. POST /wallet/recharge/verify  → verifies signature and credits wallet
 */
userRouter.get(
  "/wallet",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(WalletController().getWallet),
  ResponseMiddleware,
);

userRouter.post(
  "/wallet/recharge",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(WalletController().recharge),
  ResponseMiddleware,
);

userRouter.post(
  "/wallet/recharge/verify",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(WalletController().verifyRecharge),
  ResponseMiddleware,
);

userRouter.get(
  "/wallet/recharge/:orderId",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(WalletController().rechargeStatus),
  ResponseMiddleware,
);

/**
 * Gamification — XP/level/streak + the "Vote on 5 videos" daily mission
 */
userRouter.get(
  "/progress",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(GamificationController().getProgress),
  ResponseMiddleware,
);

userRouter.get(
  "/daily-mission",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(GamificationController().getDailyMission),
  ResponseMiddleware,
);

/**
 * Reels the signed-in user saved / liked.
 * ?cursor=&limit= -> { reels, nextCursor, hasMore }, same reel shape as GET /reels
 */
userRouter.get(
  "/reels/saved",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().savedReels),
  ResponseMiddleware,
);

userRouter.get(
  "/reels/liked",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().likedReels),
  ResponseMiddleware,
);

/**
 * Profile views of the signed-in user. ?days=30 (1-90)
 * -> { days, views, uniqueViewers, daily: [{ date, views }] }
 */
userRouter.get(
  "/insights",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().insights),
  ResponseMiddleware,
);

/**
 * Another person's public profile.
 * KEEP THIS LAST: "/:userId" matches any single segment, so every literal
 * GET route above (/profile, /wallet, /progress ...) must be registered first.
 */
userRouter.get(
  "/:userId",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(UserController().getPublicProfile),
  ResponseMiddleware,
);

module.exports = userRouter;
