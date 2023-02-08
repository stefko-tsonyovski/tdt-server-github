const mongoose = require("mongoose");

const FavoriteSchema = mongoose.Schema({
  matchId: {
    type: Number,
    required: [true, "Please provide match id"],
  },
  userId: {
    type: String,
    required: [true, "Please provide user id"],
  },
});

module.exports = mongoose.model("Favorite", FavoriteSchema);
