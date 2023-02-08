const moment = require("moment");

const Request = require("../models/Request");
const League = require("../models/League");
const User = require("../models/User");

const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");

const getAllUnapprovedRequestsByLeagueId = async (req, res) => {
  const { leagueId } = req.params;
  const { userId } = req.user;

  const league = await League.findOne({ _id: leagueId }).lean();

  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  if (league.creatorId !== userId) {
    throw new BadRequestError("Only creator has access to this information!");
  }

  const requests = await Request.find({ leagueId, isApproved: false }).lean();
  let resultRequests = [];

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const { _id, leagueId, creatorId, createdAt } = request;

    const user = await User.findOne({ _id: creatorId }).lean();
    if (!user) {
      throw new NotFoundError("User does not exist!");
    }

    const creatorFirstName = user.firstName;
    const creatorLastName = user.lastName;
    const formattedDate = moment(createdAt.toDateString()).format(
      "MMMM Do YYYY"
    );

    const finalRequest = {
      _id,
      leagueId,
      creatorId,
      creatorFirstName,
      creatorLastName,
      formattedDate,
    };

    resultRequests.push(finalRequest);
  }

  res.status(StatusCodes.OK).json({ requests: resultRequests });
};

const createRequest = async (req, res) => {
  const { leagueId } = req.body;
  const { userId: creatorId } = req.user;

  const usersByLeague = await User.find({ leagueId }).lean();
  if (usersByLeague.some((u) => u._id.toString() === creatorId.toString())) {
    throw new BadRequestError("You are already part of this league!");
  }

  const requestExists = await Request.findOne({ leagueId, creatorId }).lean();
  if (requestExists) {
    throw new BadRequestError(
      "You have already made a request to this league!"
    );
  }

  const request = await Request.create({
    leagueId,
    creatorId,
    isApproved: false,
  });

  res.status(StatusCodes.CREATED).json({ request });
};

const approveRequest = async (req, res) => {
  const { creatorId, leagueId } = req.query;
  const { userId } = req.user;

  const request = await Request.findOne({ creatorId, leagueId }).lean();
  if (!request) {
    throw new NotFoundError("Request does not exist!");
  }

  const league = await League.findOne({ _id: request.leagueId }).lean();
  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  if (league.creatorId !== userId) {
    throw new BadRequestError(
      "Only creator of the league can approve requests!"
    );
  }

  const deletedRequest = await Request.findOneAndRemove({
    creatorId,
    leagueId,
  });

  const user = await User.findOneAndUpdate(
    { _id: deletedRequest.creatorId },
    { leagueId: deletedRequest.leagueId },
    { runValidators: true, new: true }
  );

  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  res.status(StatusCodes.OK).json({ deletedRequest, user });
};

module.exports = {
  getAllUnapprovedRequestsByLeagueId,
  createRequest,
  approveRequest,
};
