const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  Firstname: { type: String, required: true },
  Lastname: { type: String, required: true },
  countryName: { type: String },
  country_code: { type: String },
  phone: { type: String, required: true },
  phonecc: { type: String },
  promotions: { type: Boolean, required: true },
  terms: { type: Boolean, required: true },
  Email: { type: String, required: true, unique: true }, // New email field
  provider: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
