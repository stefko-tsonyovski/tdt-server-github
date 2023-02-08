const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    leagueId: {
      type: String,
      required: [true, "Please provide league id"],
    },
    creatorId: {
      type: String,
      required: [true, "Please provide creator id"],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Request", RequestSchema);
