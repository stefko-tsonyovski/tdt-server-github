const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  havePickBeenMade,
  getAllByUserAndByTournament,
  createPick,
  verifyPick,
  getWeeklyBracketPoints,
  getTotalBracketPoints,
  calculateWeeklyBracketPoints,
  calculateTotalBracketPoints,
} = require("../controllers/picksController");

router.route("/haveBeenMade").get(authenticateUser, havePickBeenMade);
router.route("/").post(authenticateUser, createPick);

router
  .route("/calculateWeekly")
  .get(getWeeklyBracketPoints)
  .patch(authenticateUser, calculateWeeklyBracketPoints);

router
  .route("/calculateTotal")
  .get(getTotalBracketPoints)
  .patch(calculateTotalBracketPoints);

router.route("/verify/:bracketId").patch(authenticateUser, verifyPick);
router.route("/byTournament/:tournamentId").get(getAllByUserAndByTournament);

module.exports = router;
