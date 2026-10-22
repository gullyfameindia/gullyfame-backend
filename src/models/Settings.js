const mongoose = require("mongoose");
var Schema = mongoose.Schema;
const CMSSchema = new Schema({
  termsAndConditions: {
    type: String,
    default: "",
  },
  aboutUs: {
    type: String,
    default: "",
  },
  privacyPolicy: {
    type: String,
    default: "",
  },
  competitionRules: {
    type: String,
    default: "",
  },
  cancellationPolicy: {
    type: String,
    default: "",
  },
  refundPolicy: {
    type: String,
    default: "",
  },
  shippingLabel: {
    type: String,
    default: "",
  },
  shippingPrice: {
    type: Number,
  },
  codLabel: {
    type: String,
    default: "",
  },
  codPrice: {
    type: Number,
  },
  maintenanceImage: {
    type: String,
    default: "",
  },
  isMaintenance: {
    type: Boolean,
    default: false,
  },
  contactUs: {
    type: Object,
  },
});

var CMS = mongoose.model("CMS", CMSSchema);

module.exports = CMS;
