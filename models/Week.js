const mongoose = require("mongoose");

const WeekSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide country name"],
  },
  from: {
    type: String,
    required: [true, "Please provide start date"],
  },
  to: {
    type: String,
    required: [true, "Please provide end date"],
  },
});

module.exports = mongoose.model("Week", WeekSchema);
