const CategoryService = require("../services/CategoryService");
const fileUploadService = require("../util/s3");

module.exports = () => {
  const create = async (req, res, next) => {
    let { name, icon } = req.body;

    if (req.files && req.files.icon) {
      const file = req.files.icon;

      const uploadRes = await fileUploadService.uploadFileToAws(file);
      icon = uploadRes.images[0];
    }

    const category = await CategoryService().addCategory({
      name,
      icon,
      isActive: true,
    });

    req.rData = category;
    req.msg = "category_created";
    next();
  };

  const list = async (req, res, next) => {
    const categories = await CategoryService().getCategory();

    req.rData = categories;
    req.msg = "success";
    next();
  };

  const userList = async (req, res, next) => {
    console.log("CategoryController => userList");
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const query = { isActive: true };
    const totalCategories = await CategoryService().countCategory(query);
    const categories = await CategoryService().getCategory(query, page, limit);

    const formattedCategories = categories.map((cat) => ({
      id: cat._id,
      label: cat.name,
      icon: cat.icon || "",
      banner: cat.banner || "",
      tagline: cat.tagline || "",
      description: cat.description || "",
      followersCount: cat.followersCount || 0,
      activeContestantsCount: cat.activeContestantsCount || 0,
    }));

    req.rData = {
      page,
      limit,
      totalCategories,
      categories: formattedCategories,
    };
    req.msg = "success";
    next();
  };

  const deleteCategory = async (req, res, next) => {
    const { id } = req.params;

    await CategoryService().deleteCategory(id);

    req.msg = "category_deleted";
    next();
  };

  return { create, list, userList, delete: deleteCategory };
};
