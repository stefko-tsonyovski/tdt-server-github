const { StatusCodes } = require("http-status-codes");
const sendInvitationEmail = require("../utils/sendInvitationEmail.js");
const { Expo } = require("expo-server-sdk");

const SOCIAL_POINTS = 5;

const Invitation = require("../models/Invitation");
const { NotFoundError, BadRequestError } = require("../errors");
const User = require("../models/User");
const UserToken = require("../models/UserToken");

const sendInvitation = async (req, res) => {
  const { receiverEmail, senderEmail } = req.body;

  const sender = await User.findOne({ email: senderEmail }).lean();

  if (!receiverEmail) {
    throw new BadRequestError("Please provide valid email.");
  }

  if (sender) {
    const invitationExists = await Invitation.findOne({
      receiverEmail,
    });

    if (invitationExists) {
      throw new BadRequestError(
        `Player with email: ${receiverEmail} has been already invited to the game!`
      );
    }

    if (sender.email === receiverEmail) {
      throw new BadRequestError("Cannot send email to yourself");
    }

    await sendInvitationEmail({
      email: receiverEmail,
      origin:
        "https://play.google.com/store/apps/details?id=com.stefkonoisyboy.TennisDreamTeam&pli=1",
    });

    await Invitation.create({
      senderId: sender._id,
      receiverEmail,
    });
  }

  res.status(StatusCodes.OK).send();
};

const verifyInvitation = async (req, res) => {
  const { email: receiverEmail } = req.body;

  const invitation = await Invitation.findOne({ receiverEmail }).lean();

  if (invitation) {
    const sender = await User.findOne({ _id: invitation.senderId }).lean();
    if (sender) {
      let result = sender.socialPoints;
      result += SOCIAL_POINTS;

      await Invitation.findByIdAndUpdate(invitation._id, {
        verified: true,
      });
      await User.findById(invitation.senderId, { socialPoints: result });

      const userToken = await UserToken.findOne({ userId: sender._id }).lean();
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
          sender.firstName + " " + sender.lastName
        } you just received 5 points for inviting others!`,
        data: { withSome: "data" },
      });

      // The Expo push notification service accepts batches of notifications so
      // that you don't need to send 1000 requests to send 1000 notifications. We
      // recommend you batch your notifications to reduce the number of requests
      // and to compress them (notifications with similar content will get
      // compressed).
      let chunks = expo.chunkPushNotifications(messages);
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
  }

  res.status(StatusCodes.OK).send();
};

module.exports = {
  sendInvitation,
  verifyInvitation,
};
