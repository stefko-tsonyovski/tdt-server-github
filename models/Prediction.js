const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Please provide content"],
      max: [120, "Content cannot be more than 120 characters"],
    },
    answer: {
      type: String,
      default: "none",
    },
    creatorId: {
      type: String,
      required: [true, "Please provide creator"],
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

module.exports = mongoose.model("Prediction", PredictionSchema);
