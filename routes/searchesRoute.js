const express = require("express");
const { searchByString } = require("../controllers/searchController");
const { authenticateUser } = require("../middleware/authentication");
const router = express.Router();

router.route("/search").get(authenticateUser, searchByString);

module.exports = router;
