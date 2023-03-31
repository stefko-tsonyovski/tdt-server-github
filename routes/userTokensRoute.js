const express = require("express");
const router = express.Router();

const {
  subscribeForPushNotifications,
  generatePushNotificationsForAllUsers,
} = require("../controllers/userTokensController");

router
  .route("/")
  .post(subscribeForPushNotifications)
  .get(generatePushNotificationsForAllUsers);

module.exports = router;
