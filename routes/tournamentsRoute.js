const express = require("express");
const {
  getTournaments,
  getTournamentsByDate,
  getTournamentsByWeek,
  getSingleTournament,
  createTournament,
} = require("../controllers/tournamentsController");

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

const router = express.Router();

router
  .route("/")
  .get(authenticateUser, getTournaments)
  .post(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    createTournament
  );

router.route("/byDate").get(getTournamentsByDate);

router.route("/byWeek").get(getTournamentsByWeek);

router.route("/:id").get(getSingleTournament);

module.exports = router;
