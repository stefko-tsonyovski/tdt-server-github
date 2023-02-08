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

router
  .route("/")
  .get(authenticateUser, getTop200Leagues)
  .post(authenticateUser, createLeague);

router.route("/kick").patch(authenticateUser, kickMember);
router.route("/leave/:id").patch(authenticateUser, leaveLeague);
router.route("/updatePoints/:id").patch(authenticateUser, updatePoints);

router
  .route("/:id")
  .get(authenticateUser, getLeague)
  .patch(authenticateUser, updateLeague)
  .delete(authenticateUser, deleteLeague);

module.exports = router;
