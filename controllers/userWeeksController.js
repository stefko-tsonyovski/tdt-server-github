const UserWeek = require("../models/UserWeek");
const User = require("../models/User");

const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");

const getUserWeek = async (req, res) => {
  const { weekId } = req.params;
  const { email } = req.query;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const userWeek = await UserWeek.findOne({ userId: user._id, weekId }).lean();

  if (!userWeek) {
    return new BadRequestError("User week does not exist!");
  }

  res.status(StatusCodes.OK).json({ userWeek });
};

module.exports = {
  getUserWeek,
};
