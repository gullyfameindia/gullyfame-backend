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

module.exports = userRouter;
