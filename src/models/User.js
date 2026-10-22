const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      default: "",
      trim: true,
    },
    lastName: {
      type: String,
      default: "",
      trim: true,
    },
    username: {
      type: String,
      default: "",
      trim: true,
      sparse: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
      trim: true,
    },
    gender: {
      type: String,
      default: "",
      enum: ["male", "female", "non-binary", "prefer-not-to-say", ""],
      required: false,
    },
    role: {
      type: String,
      default: "participants",
      enum: ["participants", "fan"],
      required: false,
    },
    categories: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },
    dob: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: null,
    },
    // mobile: {
    //   type: String,
    //   required: [true, "Mobile number is required!"],
    //   unique: true,
    //   match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number!"],
    //   index: true,
    // },
    mobile: {
      type: String,
      required: false, // Important for social login
      unique: false, // Avoid duplicate error
      sparse: true, // Allow empty values
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    notificationAllowed: {
      type: Boolean,
      default: true,
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [long, lat]
    },

    googleId: {
      type: String,
      default: "",
    },

    appleId: {
      type: String,
      default: "",
    },

    device_token: {
      type: String,
      default: "",
    },

    device_type: {
      type: String,
      enum: ["android", "ios", "web", ""],
      default: "",
    },

    // Gamification
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    streakCount: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: String, // YYYY-MM-DD, compared as plain strings to avoid TZ drift
      default: "",
    },
    lastProfileNudgeAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

UserSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", UserSchema);
module.exports = User;
