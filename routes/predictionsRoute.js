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

router.route("/approved").get(authenticateUser, getAllApprovedPredictions);

router
  .route("/unapproved")
  .get(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    getAllUnapprovedPredictions
  );
router
  .route("/votedByUser")
  .get(authenticateUser, getAllVotedPredictionsByUser);

router
  .route("/")
  .post(authenticateUser, createPrediction)
  .get(getTotalPredictionPoints);

router
  .route("/approve/:id")
  .patch(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    approvePrediction
  );
router.route("/vote/:id").post(authenticateUser, createVotePrediction);
router.route("/verify/:id").post(authenticateUser, verifyVotedPrediction);
router
  .route("/:id")
  .patch(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    updatePredictionAnswer
  )
  .delete(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    deletePrediction
  );

module.exports = router;
