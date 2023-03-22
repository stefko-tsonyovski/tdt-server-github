const moment = require("moment");

const Request = require("../models/Request");
const League = require("../models/League");
const User = require("../models/User");
const UserToken = require("../models/UserToken");

const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const { Expo } = require("expo-server-sdk");

const getAllUnapprovedRequestsByLeagueId = async (req, res) => {
  const { leagueId } = req.params;
  const { email } = req.query;

  const currentUser = await User.findOne({ email }).lean();
  if (!currentUser) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = currentUser;

  const league = await League.findOne({ _id: leagueId }).lean();

  if (!league) {
    throw new NotFoundError("League does not exist!");
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
  const { leagueId, email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: creatorId } = user;

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

  const league = await League.findOne({ _id: leagueId }).lean();
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
    body: `${user.firstName + " " + user.lastName} wants to join your league!`,
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

  const request = await Request.create({
    leagueId,
    creatorId,
    isApproved: false,
  });

  res.status(StatusCodes.CREATED).json({ request });
};

const approveRequest = async (req, res) => {
  const { creatorId, leagueId, email } = req.query;

  const currentUser = await User.findOne({ email }).lean();
  if (!currentUser) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = currentUser;

  const request = await Request.findOne({ creatorId, leagueId }).lean();
  if (!request) {
    throw new NotFoundError("Request does not exist!");
  }

  const league = await League.findOne({ _id: request.leagueId }).lean();
  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  if (league.creatorId !== userId.toString()) {
    throw new BadRequestError(
      "Only creator of the league can approve requests!"
    );
  }

  const userToken = await UserToken.findOne({
    userId: creatorId,
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
    body: `Congratulations! You are part of ${league.name}!`,
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

const deleteRequest = async (req, res) => {
  const { id } = req.params;

  const deletedRequest = await Request.findOneAndRemove({
    _id: id,
  });

  if (!deletedRequest) {
    throw new NotFoundError("Request does not exist!");
  }

  res.status(StatusCodes.OK).json({ deletedRequest });
};

module.exports = {
  getAllUnapprovedRequestsByLeagueId,
  createRequest,
  approveRequest,
  deleteRequest,
};
