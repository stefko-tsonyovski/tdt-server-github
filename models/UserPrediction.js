const mongoose = require("mongoose");

const UserPredictionSchema = new mongoose.Schema(
  {
    answer: {
      type: String,
      required: [true, "Please provide answer"],
      enum: ["correct", "wrong"],
    },
    userId: {
      type: String,
      required: [true, "Please provide creator"],
    },
    predictionId: {
      type: String,
      required: [true, "Please provide creator"],
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
