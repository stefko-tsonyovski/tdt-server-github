const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: [true, "Please provide id"],
  },
  status: {
    type: String,
    required: [true, "Please provide status"],
  },
  homeId: {
    type: Number,
    required: [true, "Please provide home id"],
  },
  awayId: {
    type: Number,
    required: [true, "Please provide away id"],
  },
  date: {
    type: String,
    required: [true, "Please provide date"],
  },
  court: {
    type: String,
  },
  round: {
    type: String,
    default: "n/a",
  },
  winnerId: {
    type: Number,
  },
  homeSets: {
    type: String,
  },
  awaySets: {
    type: String,
  },
  homeSet1: {
    type: String,
  },
  homeSet2: {
    type: String,
  },
  homeSet3: {
    type: String,
  },
  homeSet4: {
    type: String,
  },
  homeSet5: {
    type: String,
  },
  awaySet1: {
    type: String,
  },
  awaySet2: {
    type: String,
  },
  awaySet3: {
    type: String,
  },
  awaySet4: {
    type: String,
  },
  awaySet5: {
    type: String,
  },
  homeAces: {
    type: Number,
  },
  homeDoubleFaults: {
    type: Number,
  },
  homeWinners: {
    type: Number,
  },
  homeUnforcedErrors: {
    type: Number,
  },
  awayAces: {
    type: Number,
  },
  awayDoubleFaults: {
    type: Number,
  },
  awayWinners: {
    type: Number,
  },
  awayUnforcedErrors: {
    type: Number,
  },
  tournamentId: {
    type: Number,
    required: [true, "Please provide tournament id"],
  },
  roundId: {
    type: String,
    required: [true, "Please provide round id"],
  },
});

module.exports = mongoose.model("Match", MatchSchema);
