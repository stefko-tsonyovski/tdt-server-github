const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");

const {
  createFavorite,
  getFavoriteMatchesByUser,
  deleteFavorite,
} = require("../controllers/favoriteController");

router.route("/").post(createFavorite).get(getFavoriteMatchesByUser);
router.route("/delete").delete(deleteFavorite);

module.exports = router;
