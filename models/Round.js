const mongoose = require("mongoose");

const RoundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide country name"],
  },
});

module.exports = mongoose.model("Round", RoundSchema);
