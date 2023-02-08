const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: [true, "Please provide id"],
  },
  name: {
    type: String,
    required: [true, "Please provide country name"],
  },
  city: {
    type: String,
    required: [true, "Please provide city"],
  },
  countryCode: {
    type: String,
    required: [true, "Please provide country code"],
  },
  code: {
    type: String,
    required: [true, "Please provide code"],
  },
  surface: {
    type: String,
    required: [true, "Please provide surface"],
  },
  startDate: {
    type: String,
    required: [true, "Please provide start date"],
  },
  endDate: {
    type: String,
    required: [true, "Please provide end date"],
  },
  season: {
    type: Number,
    required: [true, "Please provide season"],
  },
  weekId: {
    type: String,
    required: [true, "Please provide weekId"],
  },
});

module.exports = mongoose.model("Tournament", TournamentSchema);
