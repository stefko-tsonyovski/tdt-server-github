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
    type: Number,
  },
  awaySets: {
    type: Number,
  },
  homeSet1: {
    type: Number,
  },
  homeSet2: {
    type: Number,
  },
  homeSet3: {
    type: Number,
  },
  homeSet4: {
    type: Number,
  },
  homeSet5: {
    type: Number,
  },
  awaySet1: {
    type: Number,
  },
  awaySet2: {
    type: Number,
  },
  awaySet3: {
    type: Number,
  },
  awaySet4: {
    type: Number,
  },
  awaySet5: {
    type: Number,
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
