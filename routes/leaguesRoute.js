const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  getTop200Leagues,
  createLeague,
  getLeague,
  updateLeague,
  deleteLeague,
  leaveLeague,
  kickMember,
  updatePoints,
} = require("../controllers/leaguesController");

router.route("/").get(getTop200Leagues).post(createLeague);

router.route("/kick").patch(kickMember);
router.route("/leave/:id").patch(leaveLeague);
router.route("/updatePoints/:id").patch(updatePoints);

router.route("/:id").get(getLeague).patch(updateLeague).delete(deleteLeague);

module.exports = router;
