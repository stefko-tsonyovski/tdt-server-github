const UserToken = require("../models/UserToken");
const User = require("../models/User");

const { Expo } = require("expo-server-sdk");
const { NotFoundError } = require("../errors/index");
const { StatusCodes } = require("http-status-codes");

const subscribeForPushNotifications = async (req, res) => {
  const { email, token } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const existingUserToken = await UserToken.findOne({
    userId: user._id,
  }).lean();
  if (!existingUserToken) {
    const userToken = await UserToken.create({ userId: user._id, token });
    res.status(StatusCodes.CREATED).json({ userToken });
  } else {
    const updatedUserToken = await UserToken.findOneAndUpdate(
      { _id: existingUserToken._id },
      { token },
      { runValidators: true, new: true }
    );
    res.status(StatusCodes.OK).json({ updatedUserToken });
  }
};

const generatePushNotificationsForAllUsers = async (req, res) => {
  const { customMessage } = req.query;

  const userTokens = await UserToken.find({}).lean();
  let users = await User.find({}).lean();
  users = users.filter((u) =>
    userTokens.some((ut) => ut.userId === u._id.toString())
  );

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
      body: `${customMessage}`,
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

  res.status(StatusCodes.OK).json({ users });
};

module.exports = {
  subscribeForPushNotifications,
  generatePushNotificationsForAllUsers,
};
