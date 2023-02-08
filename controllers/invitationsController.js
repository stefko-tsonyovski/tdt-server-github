const { StatusCodes } = require("http-status-codes");
const sendInvitationEmail = require("../utils/sendInvitationEmail");

const SOCIAL_POINTS = 5;

const Invitation = require("../models/Invitation");
const { NotFoundError, BadRequestError } = require("../errors");
const User = require("../models/User");

const sendInvitation = async (req, res) => {
  const { receiver: receiverEmail } = req.body;
  const { userId } = req.user;
  const sender = await User.findOne({ _id: userId }).lean();

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
      origin: "https://tennisdreamteam-xqsa.onrender.com",
    });

    await Invitation.create({
      senderId: userId,
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
      invitation.verified = true;
      let result = sender.socialPoints;
      result += SOCIAL_POINTS;
      await User.findOneAndUpdate(
        { _id: invitation.senderId },
        { socialPoints: result }
      );
    }
  }

  res.status(StatusCodes.OK).send();
};

const getAllSendedInvitations = async (req, res) => {
  const { userId } = req.user;

  const invitations = await Invitation.find({ senderId: userId }).lean();

  res.status(StatusCodes.OK).json({ invitations });
};

const getAllReceivedInvitations = async (req, res) => {
  const { userId } = req.user;

  const receiver = await User.findOne({ _id: userId }).lean();

  if (!receiver) {
    throw new NotFoundError("Not found error");
  }

  const invitations = await Invitation.find({
    receiverEmail: receiver.email,
  }).lean();

  res.status(StatusCodes.OK).json({ invitations });
};

module.exports = {
  sendInvitation,
  verifyInvitation,
  getAllSendedInvitations,
  getAllReceivedInvitations,
};
