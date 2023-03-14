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
  updateFinishedBracket,
  getBracket,
} = require("../controllers/bracketsController");

router
  .route("/")
  .get(getAllBrackets)
  .post(authorizePermissions("admin", "owner"), createBracket)
  .patch(updateBracket);

router.route("/updateFinished").patch(updateFinishedBracket);

router.route("/byTournament").get(getAllBracketsByTournamentId);

router
  .route("/byTournamentAndRound")
  .get(getAllBracketsByTournamentIdAndRoundId);

router.route("/:id").get(getBracket);

module.exports = router;
