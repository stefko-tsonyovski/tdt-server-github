const express = require("express");
const router = express.Router();

const {
  subscribeForPushNotifications,
} = require("../controllers/userTokensController");

router.route("/").post(subscribeForPushNotifications);

module.exports = router;
