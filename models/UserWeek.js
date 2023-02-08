const mongoose = require("mongoose");

const UserWeekSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "Please provide user id"],
    },
    weekId: {
      type: String,
      required: [true, "Please provide week id"],
    },
    balls: {
      type: Number,
      required: [true, "Please provide balls"],
    },
    balance: {
      type: Number,
      required: [true, "Please provide balance"],
    },
    points: {
      type: Number,
      required: [true, "Please provide points"],
    },
    bracketPoints: {
      type: Number,
      required: [true, "Please provide bracket points"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserWeek", UserWeekSchema);
