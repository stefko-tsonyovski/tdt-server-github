const express = require("express");
const router = express.Router();

const {
  sendInvitation,
  verifyInvitation,
  getAllSendedInvitations,
  getAllReceivedInvitations,
} = require("../controllers/invitationsController");
const { authenticateUser } = require("../middleware/authentication");

router.route("/").post(authenticateUser, sendInvitation);
router.route("/verify").post(verifyInvitation);
router.route("/byReceiver").get(authenticateUser, getAllReceivedInvitations);
router.route("/bySender").get(authenticateUser, getAllSendedInvitations);

module.exports = router;
