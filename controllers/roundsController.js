const Round = require("../models/Round");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../errors");

const getAllRounds = async (req, res) => {
  const rounds = await Round.find({}).lean();
  res.status(StatusCodes.OK).json({ rounds });
};

const getRound = async (req, res) => {
  const { id } = req.params;

  const round = await Round.findOne({ _id: id }).lean();

  if (!round) {
    throw new NotFoundError("Round does not exist");
  }

  res.status(StatusCodes.OK).json({ round });
};

module.exports = {
  getAllRounds,
  getRound,
};
