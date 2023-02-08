const mongoose = require("mongoose");

const PickSchema = new mongoose.Schema(
  {
    playerId: {
      type: Number,
      required: [true, "Please provide player id"],
    },
    userId: {
      type: String,
      required: [true, "Please provide user id"],
    },
    bracketId: {
      type: String,
      required: [true, "Please provide bracket id"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pick", PickSchema);
