const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  getAllUnapprovedRequestsByLeagueId,
  createRequest,
  approveRequest,
  deleteRequest,
} = require("../controllers/requestsController");

router
  .route("/unapprovedByLeague/:leagueId")
  .get(getAllUnapprovedRequestsByLeagueId);

router.route("/").post(createRequest);
router.route("/approve").patch(approveRequest);
router.route("/:id").delete(deleteRequest);

module.exports = router;
