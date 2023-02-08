const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  getAllUnapprovedRequestsByLeagueId,
  createRequest,
  approveRequest,
} = require("../controllers/requestsController");

router
  .route("/unapprovedByLeague/:leagueId")
  .get(authenticateUser, getAllUnapprovedRequestsByLeagueId);

router.route("/").post(authenticateUser, createRequest);
router.route("/approve").patch(authenticateUser, approveRequest);

module.exports = router;
