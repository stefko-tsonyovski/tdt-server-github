const mongoose = require("mongoose");

const BracketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name"],
  },
  homeId: {
    type: Number,
  },
  awayId: {
    type: Number,
  },
  date: {
    type: String,
  },
  winnerId: {
    type: Number,
  },
  roundId: {
    type: String,
    required: [true, "Please provide round id"],
  },
  connectedBracketId: {
    type: String,
  },
  tournamentId: {
    type: Number,
    required: [true, "Please provide tournament id"],
  },
});

module.exports = mongoose.model("Bracket", BracketSchema);
