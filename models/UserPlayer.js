const mongoose = require("mongoose");

const UserPlayerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "Please provide user id"],
    },
    playerId: {
      type: Number,
      required: [true, "Please provide player id"],
    },
    weekId: {
      type: String,
      required: [true, "Please provide week id"],
    },
    pointsWon: {
      type: Number,
      required: [true, "Please provide points"],
    },
    balls: {
      type: Number,
      required: [true, "Please provide balls"],
    },
    isSubstitution: {
      type: Boolean,
      required: [true, "Please provide player type"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserPlayer", UserPlayerSchema);
