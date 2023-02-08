const mongoose = require("mongoose");

const UserMatchPlayerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "Please provide user id"],
    },
    matchId: {
      type: Number,
      required: [true, "Please provide match id"],
    },
    playerId: {
      type: Number,
      required: [true, "Please provide player id"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserMatchPlayer", UserMatchPlayerSchema);
