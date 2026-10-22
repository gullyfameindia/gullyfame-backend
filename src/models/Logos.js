const mongoose = require("mongoose");
var Schema = mongoose.Schema;
const LogoSchema = new Schema(
  {
    logo: {
      type: String,
      required: [true, "logo require!"],
    },
    splash: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

var Logo = mongoose.model("Logo", LogoSchema);

module.exports = Logo;
