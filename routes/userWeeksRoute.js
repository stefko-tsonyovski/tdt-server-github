const express = require("express");
const router = express.Router();

const { getUserWeek } = require("../controllers/userWeeksController");
const { authenticateUser } = require("../middleware/authentication");

router.route("/:weekId").get(getUserWeek);

module.exports = router;
