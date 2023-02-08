const Week = require("../models/Week");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");

const getAllWeeks = async (req, res) => {
  const weeks = await Week.find({}).lean();
  res.status(StatusCodes.OK).json({ weeks });
};

const createWeek = async (req, res) => {
  const { name, from, to } = req.body;

  const weekAlreadyExists = await Week.findOne({ name }).lean();
  if (weekAlreadyExists) {
    throw new BadRequestError("Week already exists!");
  }

  const week = await Week.create({
    name,
    from,
    to,
  });

  res.status(StatusCodes.CREATED).json({ week });
};

const getWeek = async (req, res) => {
  const { id } = req.params;

  const week = await Week.findOne({ _id: id }).lean();
  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  res.status(StatusCodes.OK).json({ week });
};

const getCountdown = async (req, res) => {
  const { weekId } = req.query;
  console.log(weekId);
  const week = await Week.findOne({ _id: weekId });
  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const countdownDateTime = new Date(week.from).getTime();
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

  res.status(StatusCodes.OK).json({ ...runningCountdownTime });
};

const getWeekByCurrentDate = async (req, res) => {
  const date = new Date();
  const weeks = await Week.find({}).lean();

  const week = weeks.find((week) => {
    const fromDate = new Date(week.from);
    const toDate = new Date(week.to);

    return date >= fromDate && date <= toDate;
  });

  res.status(StatusCodes.OK).json({ week });
};

const updateWeek = async (req, res) => {
  const { name, from, to } = req.body;
  const { id } = req.params;

  const week = await Week.findOneAndUpdate(
    { _id: id },
    {
      name,
      from,
      to,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  res.status(StatusCodes.OK).json({ week });
};

const deleteWeek = async (req, res) => {
  const { id } = req.params;

  const week = await Week.findOneAndRemove({ _id: id });

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  res.status(StatusCodes.OK).send();
};

module.exports = {
  getAllWeeks,
  createWeek,
  getWeek,
  getCountdown,
  getWeekByCurrentDate,
  updateWeek,
  deleteWeek,
};
