const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");

const { getAllRounds, getRound } = require("../controllers/roundsController");

router.route("/").get(authenticateUser, getAllRounds);
router.route("/:id").get(authenticateUser, getRound);

module.exports = router;
