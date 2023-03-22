const express = require("express");
const router = express.Router();

const {
  sendInvitation,
  verifyInvitation,
} = require("../controllers/invitationsController");
const { authenticateUser } = require("../middleware/authentication");

router.route("/").post(sendInvitation);
router.route("/verify").post(verifyInvitation);

module.exports = router;
