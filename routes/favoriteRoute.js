const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");

const {
  createFavorite,
  getFavoriteMatchesByUser,
  deleteFavorite,
} = require("../controllers/favoriteController");

router
  .route("/")
  .post(authenticateUser, createFavorite)
  .get(authenticateUser, getFavoriteMatchesByUser);
router.route("/:id").delete(authenticateUser, deleteFavorite);

module.exports = router;
