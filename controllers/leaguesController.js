const League = require("../models/League");
const User = require("../models/User");
const Request = require("../models/Request");
const LeagueInvitation = require("../models/LeagueInvitation");
const UserToken = require("../models/UserToken");

const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const { Expo } = require("expo-server-sdk");

// view top 200, create, edit, delete, search, join, invitation requests, kick players from league, leave league, view your league

const getTop200Leagues = async (req, res) => {
  const { searchTerm } = req.query;

  let leagues = await League.find({}).sort("-points").lean();
  if (searchTerm) {
    leagues = leagues.filter((l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  res.status(StatusCodes.OK).json({
    leagues: leagues.map((league, index) => {
      return {
        ...league,
        position: index + 1,
      };
    }),
  });
};

const createLeague = async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  if (user.leagueId) {
    throw new BadRequestError("You already have a league!");
  }

  const dbLeague = await League.findOne({ name }).lean();
  if (dbLeague) {
    throw new BadRequestError("There is already a league with such a name!");
  }

  const league = await League.create({
    ...req.body,
    creatorId: userId,
    points: 0,
  });

  await User.findOneAndUpdate(
    { _id: userId },
    { leagueId: league._id },
    { runValidators: true }
  );

  res.status(StatusCodes.CREATED).json({ league });
};

const getLeague = async (req, res) => {
  const { id } = req.params;

  const league = await League.findOne({ _id: id }).lean();

  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  res.status(StatusCodes.OK).json({ ...league });
};

const updateLeague = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const league = await League.findOne({ _id: id }).lean();

  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  if (league.creatorId !== userId.toString()) {
    throw new BadRequestError(
      "Only creator of the league can modify its name!"
    );
  }

  const leagueExists = await League.findOne({ name }).lean();

  if (leagueExists) {
    throw new BadRequestError("League with such a name already exists!");
  }

  let members = await User.find({ leagueId: league._id }).lean();
  members = members.filter((m) => m._id.toString() !== userId.toString());

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const { _id: userId } = member;

    const userToken = await UserToken.findOne({ userId }).lean();
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
      body: `${
        user.firstName + " " + user.lastName
      } updated your league's name!`,
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
  }

  const updatedLeague = await League.findOneAndUpdate(
    { _id: id },
    { ...req.body },
    { runValidators: true, new: true }
  );

  res.status(StatusCodes.OK).json({ updatedLeague });
};

const deleteLeague = async (req, res) => {
  const { id } = req.params;
  const { email } = req.query;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const league = await League.findOne({ _id: id }).lean();

  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  if (league.creatorId !== userId.toString()) {
    throw new BadRequestError("Only creator of the league can delete it!");
  }

  const deletedLeague = await League.findOneAndRemove({ _id: id });
  let users = await User.find({ leagueId: id }).lean();
  users = users.filter((u) => u._id.toString() !== userId.toString());
  const requests = await Request.find({ leagueId: id }).lean();
  const leagueInvitations = await LeagueInvitation.find({
    leagueId: id,
  }).lean();

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const { _id } = user;

    const userToken = await UserToken.findOne({ userId: _id }).lean();
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
      body: `${user.firstName + " " + user.lastName} deleted your league!`,
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
      { _id },
      { leagueId: "" },
      { runValidators: true, new: true }
    );

    if (!updatedUser) {
      throw new NotFoundError("User does not exist!");
    }
  }

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const { _id } = request;

    const deletedRequest = await Request.findOneAndRemove({ _id });

    if (!deletedRequest) {
      throw new NotFoundError("Request does not exist!");
    }
  }

  for (let i = 0; i < leagueInvitations.length; i++) {
    const leagueInvitation = leagueInvitations[i];
    const { _id } = leagueInvitation;

    const deletedLeagueInvitation = await LeagueInvitation.findOneAndRemove({
      _id,
    });

    if (!deletedLeagueInvitation) {
      throw new NotFoundError("League invitation does not exist!");
    }
  }

  res.status(StatusCodes.OK).json({ deletedLeague });
};

const leaveLeague = async (req, res) => {
  const { id } = req.params;
  const { email } = req.query;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const league = await League.findOne({ _id: id }).lean();

  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { leagueId: "" },
    { runValidators: true, new: true }
  );

  let users = await User.find({ role: "user", leagueId: id }).lean();
  users = users
    .sort((a, b) => {
      const {
        points: pointsA,
        bracketPoints: bracketPointsA,
        socialPoints: socialPointsA,
        leaguePoints: leaguePointsA,
        predictionPoints: predictionPointsA,
        firstName: firstNameA,
        lastName: lastNameA,
      } = a;
      const {
        points: pointsB,
        bracketPoints: bracketPointsB,
        socialPoints: socialPointsB,
        leaguePoints: leaguePointsB,
        predictionPoints: predictionPointsB,
        firstName: firstNameB,
        lastName: lastNameB,
      } = b;

      const totalPointsA =
        pointsA +
        bracketPointsA +
        socialPointsA +
        leaguePointsA +
        predictionPointsA;
      const totalPointsB =
        pointsB +
        bracketPointsB +
        socialPointsB +
        leaguePointsB +
        predictionPointsB;

      const fullNameA = firstNameA + lastNameA;
      const fullNameB = firstNameB + lastNameB;

      if (totalPointsA > totalPointsB) {
        return -1;
      } else if (totalPointsA < totalPointsB) {
        return 1;
      } else {
        if (fullNameA > fullNameB) {
          return 1;
        } else {
          return -1;
        }
      }
    })
    .map((user, index) => {
      const {
        points,
        bracketPoints,
        socialPoints,
        leaguePoints,
        predictionPoints,
      } = user;

      const resultUser = {
        ...user,
        position: index + 1,
        totalPoints:
          points +
          bracketPoints +
          socialPoints +
          leaguePoints +
          predictionPoints,
      };

      return resultUser;
    });

  if (users.length <= 0) {
    const deletedLeague = await League.findOneAndRemove({ _id: id });
    if (!deletedLeague) {
      throw new NotFoundError("League does not exist!");
    }

    const requests = await Request.find({ leagueId: id }).lean();
    const leagueInvitations = await LeagueInvitation.find({
      leagueId: id,
    }).lean();

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const { _id } = request;

      const deletedRequest = await Request.findOneAndRemove({ _id });

      if (!deletedRequest) {
        throw new NotFoundError("Request does not exist!");
      }
    }

    for (let i = 0; i < leagueInvitations.length; i++) {
      const leagueInvitation = leagueInvitations[i];
      const { _id } = leagueInvitation;

      const deletedLeagueInvitation = await LeagueInvitation.findOneAndRemove({
        _id,
      });

      if (!deletedLeagueInvitation) {
        throw new NotFoundError("League invitation does not exist!");
      }
    }

    res.status(StatusCodes.OK).json({ deletedLeague });
  }

  if (userId.toString() === league.creatorId) {
    const bestUser = users.find((u) => u.email !== user.email);

    const userToken = await UserToken.findOne({
      userId: bestUser._id,
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
      body: `You are the leader of ${league.name} now!`,
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

    const updatedLeague = await League.findOneAndUpdate(
      { _id: id },
      { creatorId: bestUser._id },
      { runValidators: true, new: true }
    );

    res.status(StatusCodes.OK).json({ updatedUser, updatedLeague });
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
    body: `${user.firstName + " " + user.lastName} left your league!`,
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

  res.status(StatusCodes.OK).json({ updatedUser });
};

const kickMember = async (req, res) => {
  const { memberId, leagueId, email } = req.query;

  const currentUser = await User.findOne({ email }).lean();
  if (!currentUser) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = currentUser;

  const user = await User.findOne({ _id: userId }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const member = await User.findOne({ _id: memberId }).lean();
  if (!member) {
    throw new NotFoundError("Member does not exist!");
  }

  const league = await League.findOne({ _id: leagueId }).lean();
  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  if (league.creatorId !== userId.toString()) {
    throw new BadRequestError(
      "Only creator of the league can kick members from it!"
    );
  }

  if (userId.toString() === memberId) {
    throw new BadRequestError("Cannot kick yourself!");
  }

  const members = await User.find({ leagueId }).lean();
  if (!members.some((m) => m._id.toString() === member._id.toString())) {
    throw new BadRequestError(
      "The player you want to kick is not from your league!"
    );
  }

  const userToken = await UserToken.findOne({ userId: memberId }).lean();
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
    body: `${user.firstName + " " + user.lastName} kicked you from ${
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

  const updatedUser = await User.findOneAndUpdate(
    { _id: memberId },
    { leagueId: "" },
    { runValidators: true, new: true }
  );

  res.status(StatusCodes.OK).json({ updatedUser });
};

const updatePoints = async (req, res) => {
  const { id } = req.params;
  const { email } = req.query;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const league = await League.findOne({ _id: id }).lean();
  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  if (league.creatorId !== userId.toString()) {
    throw new BadRequestError(
      "Only creator of the league can update its points!"
    );
  }

  const users = await User.find({ leagueId: id }).lean();
  let totalPoints = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const { points, bracketPoints, socialPoints, predictionPoints } = user;
    const totalUserPoints =
      points + bracketPoints + socialPoints + predictionPoints;
    totalPoints += totalUserPoints;
  }

  const updatedLeague = await League.findOneAndUpdate(
    { _id: id },
    { points: totalPoints },
    { runValidators: true, new: true }
  );

  res.status(StatusCodes.OK).json({ updatedLeague });
};

module.exports = {
  getTop200Leagues,
  createLeague,
  getLeague,
  updateLeague,
  deleteLeague,
  leaveLeague,
  kickMember,
  updatePoints,
};
