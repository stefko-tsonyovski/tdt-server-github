const express = require("express");
const router = express.Router();

const {
  getAllCountries,
  createCountry,
  getCountry,
  updateCountry,
  deleteCountry,
} = require("../controllers/countriesController");

router.route("/").get(getAllCountries).post(createCountry);
router.route("/:id").get(getCountry).patch(updateCountry).delete(deleteCountry);

module.exports = router;
