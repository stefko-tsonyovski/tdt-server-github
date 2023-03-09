const express = require("express");
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

const {
  getAllBrackets,
  getAllBracketsByTournamentId,
  getAllBracketsByTournamentIdAndRoundId,
  createBracket,
  updateBracket,
  getBracket,
} = require("../controllers/bracketsController");

router
  .route("/")
  .get(authenticateUser, getAllBrackets)
  .post(authenticateUser, authorizePermissions("admin", "owner"), createBracket)
  .patch(updateBracket);

router
  .route("/byTournament")
  .get(authenticateUser, getAllBracketsByTournamentId);

router
  .route("/byTournamentAndRound")
  .get(getAllBracketsByTournamentIdAndRoundId);

router.route("/:id").get(authenticateUser, getBracket);

module.exports = router;
