const moment = require("moment");

const LeagueInvitation = require("../models/LeagueInvitation");
const User = require("../models/User");
const League = require("../models/League");
const UserToken = require("../models/UserToken");

const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");
const { Expo } = require("expo-server-sdk");

const getAllLeagueInvitationsByReceiverId = async (req, res) => {
  const { email } = req.query;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: receiverId } = user;

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
  const { leagueId, receiverId, email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const league = await League.findOne({ _id: leagueId }).lean();
  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  if (league.creatorId !== userId.toString()) {
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

  const userToken = await UserToken.findOne({ userId: receiverId }).lean();
  if (!userToken) {
    throw new NotFoundError("User token does not exist!");
  }

  // Create a new Expo SDK client
  // optionally providing an access token if you have enabled push security
  let expo = new Expo();

  // Create the messages that you want to send to clients
  let messages = [];
  // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(userToken.token)) {
    throw new BadRequestError("Invalid expo push token!");
  }

  // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
  messages.push({
    to: userToken.token,
    sound: "default",
    body: `${user.firstName + " " + user.lastName} invited you to join ${
      league.name
    }`,
    data: { withSome: "data" },
  });

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
      // NOTE: If a ticket contains an error code in ticket.details.error, you
      // must handle it appropriately. The error codes are listed in the Expo
      // documentation:
      // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
    }
  })();

  const leagueInvitation = await LeagueInvitation.create({
    leagueId,
    receiverId,
  });

  res.status(StatusCodes.CREATED).json({ leagueInvitation });
};

const acceptInvitation = async (req, res) => {
  const { id } = req.params;
  const { email } = req.query;

  const currentUser = await User.findOne({ email }).lean();
  if (!currentUser) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = currentUser;

  const leagueInvitation = await LeagueInvitation.findOne({ _id: id }).lean();
  if (!leagueInvitation) {
    throw new NotFoundError("League invitation does not exist!");
  }

  if (leagueInvitation.receiverId !== userId.toString()) {
    throw new BadRequestError("This invitation is not for you!");
  }

  const user = await User.findOne({ _id: userId }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  if (user.leagueId) {
    throw new BadRequestError("You already have a league!");
  }

  const league = await League.findOne({ _id: leagueInvitation.leagueId });
  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  const userToken = await UserToken.findOne({
    userId: league.creatorId,
  }).lean();
  if (!userToken) {
    throw new NotFoundError("User token does not exist!");
  }

  // Create a new Expo SDK client
  // optionally providing an access token if you have enabled push security
  let expo = new Expo();

  // Create the messages that you want to send to clients
  let messages = [];
  // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(userToken.token)) {
    throw new BadRequestError("Invalid expo push token!");
  }

  // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
  messages.push({
    to: userToken.token,
    sound: "default",
    body: `${user.firstName + " " + user.lastName} is part of your league!`,
    data: { withSome: "data" },
  });

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
      // NOTE: If a ticket contains an error code in ticket.details.error, you
      // must handle it appropriately. The error codes are listed in the Expo
      // documentation:
      // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
    }
  })();

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

const deleteInvitation = async (req, res) => {
  const { id } = req.params;

  const leagueInvitation = await LeagueInvitation.findOneAndRemove({ _id: id });
  if (!leagueInvitation) {
    throw new NotFoundError("League invitation does not exist!");
  }

  res.status(StatusCodes.OK).json({ leagueInvitation });
};

module.exports = {
  getAllLeagueInvitationsByReceiverId,
  createInvitation,
  acceptInvitation,
  deleteInvitation,
};
