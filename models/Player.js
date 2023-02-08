const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: [true, "Please provide id"],
  },
  name: {
    type: String,
    required: [true, "Please provide name"],
  },
  country: {
    type: String,
    required: [true, "Please provide country name"],
  },
  points: {
    type: Number,
    required: [true, "Please provide points"],
  },
  ranking: {
    type: Number,
    required: [true, "Please provide ranking"],
  },
  price: {
    type: Number,
    required: [true, "Please provide price"],
  },
  imageUrl: {
    type: String,
    required: [true, "Please provide image"],
  },
  gender: {
    type: String,
    required: [true, "Please provide gender"],
  },
});

module.exports = mongoose.model("Player", PlayerSchema);
