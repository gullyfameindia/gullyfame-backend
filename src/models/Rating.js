const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RatingSchema = new Schema(
  {
    // ----------- USER + PRODUCT + ORDER ----------
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productId: {
      type: Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "UserOrders",
      required: true,
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    // ----------- RATING (1 to 5 stars) ----------
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    // ----------- FEEDBACK ----------
    reviewText: {
      type: String,
      default: "",
    },

    // ----------- REVIEW PHOTOS ----------
    reviewImages: [
      {
        url: String,
      },
    ],

    // ----------- STATUS ----------
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rating", RatingSchema);
