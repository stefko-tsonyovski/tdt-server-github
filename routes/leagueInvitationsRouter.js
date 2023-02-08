const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  getAllLeagueInvitationsByReceiverId,
  createInvitation,
  acceptInvitation,
} = require("../controllers/leagueInvitationsController");

router.route("/").post(authenticateUser, createInvitation);

router
  .route("/byReceiver")
  .get(authenticateUser, getAllLeagueInvitationsByReceiverId);

router.route("/:id").patch(authenticateUser, acceptInvitation);

module.exports = router;
