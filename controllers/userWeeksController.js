const UserWeek = require("../models/UserWeek");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");

const getUserWeek = async (req, res) => {
  const { weekId } = req.params;
  const { userId } = req.user;

  const userWeek = await UserWeek.findOne({ userId, weekId }).lean();

  if (!userWeek) {
    return new BadRequestError("User week does not exist!");
  }

  res.status(StatusCodes.OK).json({ userWeek });
};

module.exports = {
  getUserWeek,
};
