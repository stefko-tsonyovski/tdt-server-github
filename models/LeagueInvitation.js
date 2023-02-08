const mongoose = require("mongoose");

const LeagueInvitationSchema = new mongoose.Schema(
  {
    leagueId: {
      type: String,
      required: [true, "Please provide league id"],
    },
    receiverId: {
      type: String,
      required: [true, "Please provide creator id"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LeagueInvitation", LeagueInvitationSchema);
