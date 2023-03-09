const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: [true, "Please provide id"],
  },
  ultimateTennisID: {
    type: String,
    required: [true, "Please provide ultimate tennis ID"],
  },
  name: {
    type: String,
    required: [true, "Please provide name"],
  },
  country: {
    type: String,
    default: "Spain",
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
    default: 0,
  },
  imageUrl: {
    type: String,
    default:
      "https://res.cloudinary.com/dcvkhhwth/image/upload/v1677965176/default-player_bu9plw.png",
  },
  gender: {
    type: String,
    default: "male",
  },
});

module.exports = mongoose.model("Player", PlayerSchema);
