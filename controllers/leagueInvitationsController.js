const moment = require("moment");

const LeagueInvitation = require("../models/LeagueInvitation");
const User = require("../models/User");
const League = require("../models/League");

const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");

const getAllLeagueInvitationsByReceiverId = async (req, res) => {
  const { userId: receiverId } = req.user;

  const leagueInvitations = await LeagueInvitation.find({ receiverId }).lean();
  let resultLeagueInvitations = [];

  for (let i = 0; i < leagueInvitations.length; i++) {
    const leagueInvitation = leagueInvitations[i];
    const { _id, leagueId, receiverId, createdAt } = leagueInvitation;

    const league = await League.findOne({ _id: leagueId }).lean();
    if (!league) {
      throw new NotFoundError("League does not exist!");
    }

    const leagueName = league.name;
    const formattedDate = moment(createdAt.toDateString()).format(
      "MMMM Do YYYY"
    );

    const finalLeagueInvitation = {
      _id,
      leagueId,
      receiverId,
      leagueName,
      formattedDate,
    };

    resultLeagueInvitations.push(finalLeagueInvitation);
  }

  res
    .status(StatusCodes.OK)
    .json({ leagueInvitations: resultLeagueInvitations });
};

const createInvitation = async (req, res) => {
  const { userId } = req.user;
  const { leagueId, receiverId } = req.body;

  const league = await League.findOne({ _id: leagueId }).lean();
  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  if (league.creatorId !== userId) {
    throw new BadRequestError("Only creator can send invitations!");
  }

  const leagueInvitationExists = await LeagueInvitation.findOne({
    leagueId,
    receiverId,
  }).lean();

  if (leagueInvitationExists) {
    throw new BadRequestError("You have already invited this player!");
  }

  const receiver = await User.findOne({ _id: receiverId }).lean();
  if (!receiver) {
    throw new NotFoundError("Receiver does not exist!");
  }

  if (receiver.leagueId === leagueId) {
    throw new BadRequestError("This player is already in your league!");
  }

  const leagueInvitation = await LeagueInvitation.create({
    leagueId,
    receiverId,
  });
  res.status(StatusCodes.CREATED).json({ leagueInvitation });
};

const acceptInvitation = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const leagueInvitation = await LeagueInvitation.findOne({ _id: id }).lean();
  if (!leagueInvitation) {
    throw new NotFoundError("League invitation does not exist!");
  }

  if (leagueInvitation.receiverId !== userId) {
    throw new BadRequestError("This invitation is not for you!");
  }

  const user = await User.findOne({ _id: userId }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  if (user.leagueId) {
    throw new BadRequestError("You already have a league!");
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { leagueId: leagueInvitation.leagueId },
    { runValidator: true, new: true }
  );

  const deletedLeagueInvitation = await LeagueInvitation.findOneAndRemove({
    _id: id,
  });

  res.status(StatusCodes.OK).json({ deletedLeagueInvitation, updatedUser });
};

module.exports = {
  getAllLeagueInvitationsByReceiverId,
  createInvitation,
  acceptInvitation,
};
