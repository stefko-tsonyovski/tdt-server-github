const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide country name"],
  },
  countryFlag: {
    type: String,
    required: [true, "Please provide country flag"],
  },
  key: {
    type: String,
    required: [true, "Please provide key"],
  },
  code: {
    type: String,
    required: [true, "Please provide code"],
  },
});

module.exports = mongoose.model("Country", CountrySchema);
