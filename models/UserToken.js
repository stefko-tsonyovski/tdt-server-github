const mongoose = require("mongoose");

const UserTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
    },
    token: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserToken", UserTokenSchema);
