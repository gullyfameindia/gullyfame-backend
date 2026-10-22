const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const FAQsSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, "question require!"],
    },
    answer: {
      type: String,
      required: [true, "answer require!"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

var FAQs = mongoose.model("FAQs", FAQsSchema);

module.exports = FAQs;
