const mongoose = require("mongoose");

const LeagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide country name"],
  },
  points: {
    type: Number,
    required: [true, "Please provide points"],
  },
  creatorId: {
    type: String,
    required: [true, "Please provide creator id"],
  },
});

module.exports = mongoose.model("League", LeagueSchema);
