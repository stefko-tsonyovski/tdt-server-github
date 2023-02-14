const express = require("express");
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");
const {
  getAll,
  getAllPlayers,
  getAllPlayersInTeam,
  getAllSubstitutionsInTeam,

  createPlayer,
  updatePlayer,
  addPlayerInTeam,
  performSubstitution,
  deletePlayerInTeam,
  addBallToUserPlayer,
  deleteBallFromUserPlayer,
  calculatePointsForUserPlayers,
  calculateTotalPoints,

  getWeeklyPoints,
  getTotalPoints,

  getSinglePlayer,
  getSinglePlayerMatches,
} = require("../controllers/playersController");

router
  .route("/")
  .post(getAllPlayers)
  .get(getAll)
  .patch(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    updatePlayer
  );

router
  .route("/create")
  .post(authenticateUser, authorizePermissions("admin", "owner"), createPlayer);

router.route("/team").post(getAllPlayersInTeam).delete(deletePlayerInTeam);

router
  .route("/substitutions")
  .post(getAllSubstitutionsInTeam)
  .patch(performSubstitution);

router.route("/add").post(addPlayerInTeam);
router.route("/addBall").patch(addBallToUserPlayer);
router.route("/deleteBall").patch(deleteBallFromUserPlayer);

router
  .route("/calculateWeekly")
  .get(getWeeklyPoints)
  .patch(calculatePointsForUserPlayers);

router.route("/calculateTotal").get(getTotalPoints).patch(calculateTotalPoints);

router.route("/calculateTotal").patch(authenticateUser, calculateTotalPoints);
router.route("/:id").get(authenticateUser, getSinglePlayer);

router.route("/:id/matches").get(authenticateUser, getSinglePlayerMatches);

module.exports = router;
