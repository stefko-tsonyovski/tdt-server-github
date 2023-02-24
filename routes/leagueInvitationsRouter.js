const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  getAllLeagueInvitationsByReceiverId,
  createInvitation,
  acceptInvitation,
  deleteInvitation,
} = require("../controllers/leagueInvitationsController");

router.route("/").post(createInvitation);

router.route("/byReceiver").get(getAllLeagueInvitationsByReceiverId);

router.route("/:id").patch(acceptInvitation).delete(deleteInvitation);

module.exports = router;
