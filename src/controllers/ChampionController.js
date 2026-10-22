const ChampionService = require("../services/ChampionService");

module.exports = () => {
  const list = async (req, res, next) => {
    console.log("ChampionController => list");
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const data = await ChampionService().getChampions(page, limit);

    req.rData = data;
    req.msg = "success";
    next();
  };

  return { list };
};
