const express = require("express");
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");
const {
  getAllApprovedPredictions,
  getAllUnapprovedPredictions,
  getTotalPredictionPoints,
  getAllVotedPredictionsByUser,
  createPrediction,
  createVotePrediction,
  verifyVotedPrediction,
  approvePrediction,
  updatePredictionAnswer,
  deletePrediction,
} = require("../controllers/predictionsController");

router.route("/approved").get(getAllApprovedPredictions);

router.route("/unapproved").get(getAllUnapprovedPredictions);
router.route("/votedByUser").get(getAllVotedPredictionsByUser);

router.route("/").post(createPrediction).get(getTotalPredictionPoints);

router.route("/approve/:id").patch(approvePrediction);
router.route("/vote/:id").post(createVotePrediction);
router.route("/verify/:id").post(verifyVotedPrediction);
router.route("/:id").patch(updatePredictionAnswer).delete(deletePrediction);

module.exports = router;
