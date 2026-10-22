const mongoose = require("mongoose");
var Schema = mongoose.Schema;
const BannersSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "title require!"],
    },
    banner: {
      type: String,
      required: [true, "banner require!"],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

var Banners = mongoose.model("Banners", BannersSchema);

module.exports = Banners;
