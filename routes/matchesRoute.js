const express = require("express");
const router = express.Router();

const {
  createMatch,
  updateMatch,
  getSingleMatch,
  getSingleMatchManual,
  getMatchesByTournamentIdAndRoundId,
  getMatchesByTournamentIdAndDate,
  getMatchesByTournamentIdGroupedByRoundId,
  getMatchesByPlayerGroupedByTournamentId,
  getLastMatchesByPlayer,
  getLastHedToHeadMatches,
} = require("../controllers/matchesController");
const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

router.route("/lastH2HByPlayer").post(authenticateUser, getLastMatchesByPlayer);
router.route("/lastByPlayer").post(authenticateUser, getLastMatchesByPlayer);
router
  .route("/")
  .post(authenticateUser, authorizePermissions("admin", "owner"), createMatch);

router
  .route("/byTournamentAndRound")
  .get(authenticateUser, getMatchesByTournamentIdAndRoundId);

router
  .route("/byTournamentGroupByRound")
  .get(authenticateUser, getMatchesByTournamentIdGroupedByRoundId);
router
  .route("/byTournamentAndDate")
  .get(authenticateUser, getMatchesByTournamentIdAndDate);
router
  .route("/byPlayerGroupByTournament")
  .get(authenticateUser, getMatchesByPlayerGroupedByTournamentId);

router
  .route("/:id")
  .get(authenticateUser, getSingleMatch)
  .patch(authenticateUser, authorizePermissions("admin", "owner"), updateMatch);

router.route("/manual/:id").get(authenticateUser, getSingleMatchManual);

module.exports = router;
