const router = require("express").Router();

router.use("/auth", require("./auth"));
router.use("/admin", require("./adminRoutes"));
router.use("/user", require("./users"));
router.use("/public", require("./public"));
router.use("/chat", require("./chat"));
router.use("/notification", require("./notification"));
router.use("/competitions", require("./competitions"));
router.use("/feed", require("./feed"));
router.use("/reels", require("./reels"));
router.use("/search", require("./search"));
router.use("/payments", require("./payments"));

module.exports = router;
