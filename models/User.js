const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please provide first name"],
    minlength: 3,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: [true, "Please provide last name"],
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide email"],
    validate: {
      validator: validator.isEmail,
      message: "Please provide valid email",
    },
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  points: {
    type: Number,
    required: [true, "Please provide points"],
  },
  bracketPoints: {
    type: Number,
    required: [true, "Please provide bracket points"],
  },
  socialPoints: {
    type: Number,
    required: [true, "Please provide social points"],
  },
  leaguePoints: {
    type: Number,
    required: [true, "Please provide league points"],
  },
  predictionPoints: {
    type: Number,
    required: [true, "Please provide prediction points"],
  },
  leagueId: {
    type: String,
  },
  trades: {
    type: Number,
    required: [true, "Please provide trades"],
  },
});

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model("User", UserSchema);
