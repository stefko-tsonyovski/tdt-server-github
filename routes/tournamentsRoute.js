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

router.route("/byDate/:date").get(authenticateUser, getTournamentsByDate);

router.route("/byWeek").get(authenticateUser, getTournamentsByWeek);

router.route("/:id").get(authenticateUser, getSingleTournament);

module.exports = router;
