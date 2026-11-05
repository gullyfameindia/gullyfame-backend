const userRouter = require("express").Router();
const LogoController = require("../controllers/LogoController");
const AudioController = require("../controllers/AudioController");
const FilterController = require("../controllers/FilterController");
const StickerController = require("../controllers/StickerController");
const SoundFxController = require("../controllers/SoundFxController");
const PublicContentController = require("../controllers/PublicContentController");
const ErrorHandlerMiddleware = require("../middlewares/ErrorHandlerMiddleware");
const ResponseMiddleware = require("../middlewares/ResponseMiddleware");
const AuthMiddleware = require("../middlewares/AuthMiddleware");

userRouter.get(
  "/logo",
  ErrorHandlerMiddleware(LogoController().getAllLogoList),
  ResponseMiddleware
);

// Changing the app logo / splash is an admin action — reading them stays public.
userRouter.post(
  "/logo",
  AuthMiddleware().verifyAdminToken,
  ErrorHandlerMiddleware(LogoController().addLogo),
  ResponseMiddleware
);

userRouter.get(
  "/splash",
  ErrorHandlerMiddleware(LogoController().getSplash),
  ResponseMiddleware
);

/**
 * Audio library
 */
userRouter.get(
  "/audio",
  ErrorHandlerMiddleware(AudioController().list),
  ResponseMiddleware
);

/**
 * Filters + stickers (editor asset catalogs)
 */
userRouter.get(
  "/filters",
  ErrorHandlerMiddleware(FilterController().list),
  ResponseMiddleware
);

userRouter.get(
  "/stickers",
  ErrorHandlerMiddleware(StickerController().list),
  ResponseMiddleware
);

userRouter.get(
  "/soundfx",
  ErrorHandlerMiddleware(SoundFxController().list),
  ResponseMiddleware
);

/**
 * CMS — public read-only mirrors of the admin Settings content
 */
userRouter.get(
  "/termAndCondition",
  ErrorHandlerMiddleware(PublicContentController().getTerms),
  ResponseMiddleware
);

userRouter.get(
  "/aboutUs",
  ErrorHandlerMiddleware(PublicContentController().getAboutUs),
  ResponseMiddleware
);

userRouter.get(
  "/privacyPolicy",
  ErrorHandlerMiddleware(PublicContentController().getPrivacyPolicy),
  ResponseMiddleware
);

userRouter.get(
  "/competitionRules",
  ErrorHandlerMiddleware(PublicContentController().getCompetitionRules),
  ResponseMiddleware
);

module.exports = userRouter;
