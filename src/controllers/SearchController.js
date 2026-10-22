const SearchService = require("../services/SearchService");

module.exports = () => {
  const globalSearch = async (req, res, next) => {
    console.log("SearchController => globalSearch");
    const { userId } = req.body;
    const q = req.query.q || "";
    const type = req.query.type || "all";
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 15;

    const validTypes = ["all", "users", "competitions", "reels"];
    if (!validTypes.includes(type)) {
      req.rCode = 0;
      req.msg = "invalid_search_type";
      return next();
    }

    const data = await SearchService().search(q, type, page, limit, userId);

    req.rData = data;
    req.msg = "success";
    next();
  };

  return { globalSearch };
};
