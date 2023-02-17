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
  getUserByEmail,
} = require("../controllers/usersController");

router.route("/").get(getTop200Users);
router.route("/all").get(getAllUsers);
router.route("/showMe").get(getCurrentUserPosition);
router.route("/teamByUser").get(getTeamByUserAndByWeek);
router.route("/weekly").get(getWeeklyPointsByUser);
router.route("/total").get(getTotalPointsByUser);
router.route("/trades").get(getTradesByUser);
router.route("/byLeague/:leagueId").get(getUsersByLeague);
router.route("/byEmail/:email").get(getUserByEmail);
router.route("/:id").get(getUser);

module.exports = router;
