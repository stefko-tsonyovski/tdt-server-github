const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  getAllUsers,
  getTop200Users,
  getUsersByLeague,
  getCurrentUserPosition,
  getTeamByUserAndByWeek,
  getWeeklyPointsByUser,
  getTotalPointsByUser,
  getTradesByUser,
  getUser,
} = require("../controllers/usersController");

router.route("/").get(authenticateUser, getTop200Users);
router.route("/all").get(authenticateUser, getAllUsers);
router.route("/showMe").get(authenticateUser, getCurrentUserPosition);
router.route("/teamByUser").get(authenticateUser, getTeamByUserAndByWeek);
router.route("/weekly").get(authenticateUser, getWeeklyPointsByUser);
router.route("/total").get(authenticateUser, getTotalPointsByUser);
router.route("/trades").get(getTradesByUser);
router.route("/byLeague/:leagueId").get(authenticateUser, getUsersByLeague);
router.route("/:id").get(authenticateUser, getUser);

module.exports = router;
