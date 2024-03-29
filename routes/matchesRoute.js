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
  getMatchesByPlayerIdGroupedByTournamentId,
  getLastMatchesByPlayer,
  getLastHedToHeadMatches,
} = require("../controllers/matchesController");
const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

router.route("/lastH2HByPlayer").post(getLastHedToHeadMatches);
router.route("/lastByPlayer").post(getLastMatchesByPlayer);
router.route("/").post(authorizePermissions("admin", "owner"), createMatch);

router.route("/byTournamentAndRound").get(getMatchesByTournamentIdAndRoundId);

router
  .route("/byTournamentGroupByRound")
  .get(getMatchesByTournamentIdGroupedByRoundId);
router.route("/byTournamentAndDate").get(getMatchesByTournamentIdAndDate);
router
  .route("/byPlayerGroupByTournament")
  .get(getMatchesByPlayerIdGroupedByTournamentId);

router
  .route("/:id")
  .get(getSingleMatch)
  .patch(authorizePermissions("admin", "owner"), updateMatch);

router.route("/manual/:id").get(getSingleMatchManual);

module.exports = router;
