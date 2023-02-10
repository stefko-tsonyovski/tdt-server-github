const express = require("express");
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

const {
  getAllWeeks,
  createWeek,
  getWeek,
  getCountdown,
  getWeekByCurrentDate,
  updateWeek,
  deleteWeek,
} = require("../controllers/weeksController");

router
  .route("/")
  .get(getAllWeeks)
  .post(authenticateUser, authorizePermissions("admin", "owner"), createWeek);

router.route("/byCurrentDate").get(getWeekByCurrentDate);

router.route("/countdown").get(getCountdown);

router
  .route("/:id")
  .get(authenticateUser, getWeek)
  .patch(authenticateUser, authorizePermissions("admin", "owner"), updateWeek)
  .delete(authenticateUser, authorizePermissions("admin", "owner"), deleteWeek);

module.exports = router;
