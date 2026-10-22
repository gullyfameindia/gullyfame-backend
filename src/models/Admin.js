const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminSchema = new Schema(
  {
    email: { type: String, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["ADMIN", "SPONSOR"],
      default: "ADMIN",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);
