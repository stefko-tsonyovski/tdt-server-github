const Prediction = require("../models/Prediction");
const User = require("../models/User");
const UserPrediction = require("../models/UserPrediction");

const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");

const PREDICTION_POINTS = 6;
const INVEST_POINTS = 3;

const getAllApprovedPredictions = async (req, res) => {
  const { page, itemsPerPage, email } = req.query;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  let predictions = await Prediction.find({
    isApproved: true,
    answer: "none",
  })
    .sort("-createdAt")
    .lean();
  let resultPredictions = [];

  predictions = predictions.filter((prediction) => {
    const endDate = new Date(prediction.createdAt.toISOString());
    endDate.setDate(endDate.getDate() + 3);
    const current = new Date();

    return current <= endDate;
  });

  for (let i = 0; i < predictions.length; i++) {
    const prediction = predictions[i];
    const { creatorId, createdAt } = prediction;

    const userPrediction = await UserPrediction.findOne({
      userId,
      predictionId: prediction._id,
    }).lean();

    if (userPrediction) {
      continue;
    }

    const user = await User.findOne({ _id: creatorId });
    if (!user) {
      throw new NotFoundError("User does not exist!");
    }

    const { firstName: creatorFirstName, lastName: creatorLastName } = user;

    const endDate = new Date(createdAt.toISOString());
    endDate.setDate(endDate.getDate() + 3);

    const countdownDateTime = new Date(endDate.toISOString()).getTime();
    const currentTime = new Date().getTime();
    const remainingDayTime = countdownDateTime - currentTime;
    const totalDays = Math.floor(remainingDayTime / (1000 * 60 * 60 * 24));

    const totalHours = Math.floor(
      (remainingDayTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    const totalMinutes = Math.floor(
      (remainingDayTime % (1000 * 60 * 60)) / (1000 * 60)
    );

    const totalSeconds = Math.floor((remainingDayTime % (1000 * 60)) / 1000);

    const runningCountdownTime = {
      countdownDays: totalDays,
      countdownHours: totalHours,
      countdownMinutes: totalMinutes,
      countdownSeconds: totalSeconds,
    };

    const resultPrediction = {
      ...prediction,
      ...runningCountdownTime,
      creatorFirstName,
      creatorLastName,
    };

    resultPredictions.push(resultPrediction);
  }

  const totalItems = resultPredictions.length;

  const start = (Number(page) - 1) * Number(itemsPerPage);
  const end = start + Number(itemsPerPage);
  resultPredictions = resultPredictions.slice(start, end);

  res
    .status(StatusCodes.OK)
    .json({ predictions: resultPredictions, totalItems });
};

const getAllUnapprovedPredictions = async (req, res) => {
  const { page, itemsPerPage } = req.query;

  const predictions = await Prediction.find({ isApproved: false })
    .sort("-createdAt")
    .lean();
  let resultPredictions = [];

  for (let i = 0; i < predictions.length; i++) {
    const prediction = predictions[i];
    const { creatorId } = prediction;

    const user = await User.findOne({ _id: creatorId }).lean();
    if (!user) {
      throw new NotFoundError("User does not exist!");
    }

    const { firstName: creatorFirstName, lastName: creatorLastName } = user;

    const resultPrediction = {
      ...prediction,
      creatorFirstName,
      creatorLastName,
    };

    resultPredictions.push(resultPrediction);
  }

  const totalItems = resultPredictions.length;

  const start = (Number(page) - 1) * Number(itemsPerPage);
  const end = start + Number(itemsPerPage);
  resultPredictions = resultPredictions.slice(start, end);

  res
    .status(StatusCodes.OK)
    .json({ predictions: resultPredictions, totalItems });
};

const getTotalPredictionPoints = async (req, res) => {
  const { email } = req.query;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  res.status(StatusCodes.OK).json({ points: user.predictionPoints });
};

const getAllVotedPredictionsByUser = async (req, res) => {
  const { page, itemsPerPage, email } = req.query;

  const currentUser = await User.findOne({ email }).lean();
  if (!currentUser) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = currentUser;

  let votedPredictions = await UserPrediction.find({ userId })
    .sort("-createdAt")
    .lean();

  let resultVoteProductions = [];
  for (let i = 0; i < votedPredictions.length; i++) {
    const { predictionId, answer, _id } = votedPredictions[i];
    const prediction = await Prediction.findOne({
      _id: predictionId,
    }).lean();

    const { creatorId } = prediction;

    const user = await User.findOne({ _id: creatorId });
    if (!user) {
      throw new NotFoundError("User does not exist!");
    }

    const { firstName: creatorFirstName, lastName: creatorLastName } = user;

    resultVoteProductions.push({
      _id,
      answer: answer,
      prediction: {
        ...prediction,
        creatorFirstName,
        creatorLastName,
      },
    });
  }

  const totalItems = resultVoteProductions.length;

  const start = (Number(page) - 1) * Number(itemsPerPage);
  const end = start + Number(itemsPerPage);
  resultVoteProductions = resultVoteProductions.slice(start, end);

  res
    .status(StatusCodes.OK)
    .json({ votePredictions: resultVoteProductions, totalItems });
};

const createPrediction = async (req, res) => {
  const { content, email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: creatorId } = user;

  const prediction = await Prediction.create({
    content,
    creatorId,
    isApproved: false,
  });
  const { _id: predictionId } = prediction;

  const userPrediction = await UserPrediction.create({
    predictionId,
    userId: creatorId,
    answer: "correct",
  });

  const oldUser = await User.findOne({ _id: creatorId });
  if (!oldUser) {
    throw new NotFoundError("User does not exist!");
  }

  if (oldUser.predictionPoints < 3) {
    throw new BadRequestError("You don't have enough prediction points!");
  }

  await User.findOneAndUpdate(
    { _id: creatorId },
    { predictionPoints: oldUser.predictionPoints - 3 },
    { runValidators: true, new: true }
  );

  res.status(StatusCodes.CREATED).json({ prediction, userPrediction, user });
};

const approvePrediction = async (req, res) => {
  const { id } = req.params;

  const prediction = await Prediction.findOneAndUpdate(
    { _id: id },
    { isApproved: true },
    { runValidators: true, new: true }
  );
  if (!prediction) {
    throw new NotFoundError("Prediction does not exist!");
  }

  res.status(StatusCodes.OK).json({ prediction });
};

const updatePredictionAnswer = async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  const prediction = await Prediction.findOneAndUpdate(
    { _id: id },
    { answer },
    { runValidators: true, new: true }
  );
  if (!prediction) {
    throw new NotFoundError("Prediction does not exist!");
  }

  res.status(StatusCodes.OK).json({ prediction });
};

const createVotePrediction = async (req, res) => {
  const { id: predictionId } = req.params;
  const { answer, email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: creatorId } = user;

  const voter = await User.findOne({ _id: creatorId }).lean();
  if (!voter) {
    throw new NotFoundError("User does not exist");
  }

  const prediction = await Prediction.findOne({ _id: predictionId }).lean();
  if (!prediction) {
    throw new NotFoundError("Prediction does not exist!");
  }

  const voterPrediction = await UserPrediction.findOne({
    userId: creatorId,
    predictionId,
  }).lean();

  if (voterPrediction) {
    throw new BadRequestError("You already have vote for this prediction!");
  }

  let voterPredictionPoints = voter.predictionPoints;
  voterPredictionPoints -= INVEST_POINTS;
  await User.findOneAndUpdate(
    { _id: creatorId },
    { predictionPoints: voterPredictionPoints }
  );

  await UserPrediction.create(
    {
      answer,
      userId: creatorId,
      predictionId,
    },
    { runValidators: true }
  );

  res.status(StatusCodes.OK).send();
};

const verifyVotedPrediction = async (req, res) => {
  const { id: votePredictionId } = req.params;
  const { email } = req.query;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: creatorId } = user;

  const votePrediction = await UserPrediction.findOne({
    _id: votePredictionId,
    userId: creatorId,
  }).lean();

  if (!votePrediction) {
    throw new NotFoundError("Vote prediction does not exist!");
  }

  if (votePrediction.isVerified) {
    throw new BadRequestError("Vote is already verified!");
  }

  const prediction = await Prediction.findOne({
    _id: votePrediction.predictionId,
  }).lean();

  if (prediction.answer === "none") {
    throw new BadRequestError("No answer provided yet!");
  }

  if (prediction.answer === votePrediction.answer) {
    let resultPoints = user.predictionPoints;
    resultPoints += PREDICTION_POINTS;

    await User.findOneAndUpdate(
      { _id: creatorId },
      { predictionPoints: resultPoints }
    );
  }

  await UserPrediction.findOneAndUpdate(
    { _id: votePredictionId, userId: creatorId },
    { isVerified: true }
  );

  res.status(StatusCodes.OK).send();
};

const deletePrediction = async (req, res) => {
  const { id } = req.params;

  const prediction = await Prediction.findOneAndRemove({ _id: id });
  if (!prediction) {
    throw new NotFoundError("Prediction does not exist!");
  }

  res.status(StatusCodes.OK).json({ prediction });
};

module.exports = {
  getAllApprovedPredictions,
  getAllUnapprovedPredictions,
  getTotalPredictionPoints,
  getAllVotedPredictionsByUser,
  createPrediction,
  approvePrediction,
  updatePredictionAnswer,
  createVotePrediction,
  verifyVotedPrediction,
  deletePrediction,
};
