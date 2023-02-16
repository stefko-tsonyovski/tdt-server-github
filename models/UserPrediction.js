const mongoose = require("mongoose");

const UserPredictionSchema = new mongoose.Schema(
  {
    answer: {
      type: String,
      enum: ["correct", "wrong"],
    },
    userId: {
      type: String,
    },
    predictionId: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserPrediction", UserPredictionSchema);
