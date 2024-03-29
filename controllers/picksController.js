const Pick = require("../models/Pick");
const Bracket = require("../models/Bracket");
const Tournament = require("../models/Tournament");
const Week = require("../models/Week");
const Round = require("../models/Round");
const UserWeek = require("../models/UserWeek");
const User = require("../models/User");
const Match = require("../models/Match");

const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");
const { BRACKET } = require("../utils/pointsSystem");

const havePickBeenMade = async (req, res) => {
  const { bracketId } = req.query;
  const { userId } = req.user;

  const pick = await Pick.findOne({ userId, bracketId });

  if (!pick) {
    return res.status(StatusCodes.OK).json({ haveBeenMade: false });
  }

  res.status(StatusCodes.OK).json({ haveBeenMade: true, pick });
};

const getAllByUserAndByTournament = async (req, res) => {
  const { tournamentId } = req.params;
  const { roundId, email } = req.query;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const bracketsByTournament = await Bracket.find({
    tournamentId: Number(tournamentId),
  }).lean();

  let picksByUser = await Pick.find({ userId }).lean();
  picksByUser = picksByUser.filter((p) =>
    bracketsByTournament.some(
      (b) =>
        b._id.toString() === p.bracketId.toString() && b.roundId === roundId
    )
  );

  res.status(StatusCodes.OK).json({ picks: picksByUser });
};

const createPick = async (req, res) => {
  const { bracketId, playerId, email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const bracket = await Bracket.findOne({ _id: bracketId }).lean();

  if (!bracket) {
    throw new NotFoundError("Bracket not found!");
  }

  if (bracket.homeId < 0 || bracket.awayId < 0) {
    throw new BadRequestError("There should be 2 players available!");
  }

  const tournament = await Tournament.findOne({
    id: bracket.tournamentId,
  }).lean();

  if (!tournament) {
    throw new NotFoundError("Tournament not found!");
  }

  const week = await Week.findOne({ _id: tournament.weekId }).lean();

  if (!week) {
    throw new NotFoundError("Week not found!");
  }

  const match = await Match.findOne({
    tournamentId: tournament.id,
    homeId: bracket.homeId,
    awayId: bracket.awayId,
  }).lean();

  if (!match) {
    throw new NotFoundError("Match does not exist!");
  }

  const start = new Date(match.date);
  const twoHours = 1000 * 60 * 60 * 2;
  const current = new Date(Date.now() + twoHours);

  if (current >= start) {
    throw new BadRequestError("Deadline passed!");
  }

  const pickExists = await Pick.findOne({ bracketId, userId }).lean();

  if (pickExists) {
    throw new BadRequestError("Pick already exists!");
  }

  const pick = await Pick.create({ bracketId, playerId, userId });

  res.status(StatusCodes.CREATED).json({ pick });
};

const verifyPick = async (req, res) => {
  const { bracketId } = req.params;
  const { email } = req.query;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const bracket = await Bracket.findOne({ _id: bracketId }).lean();
  if (!bracket) {
    throw new NotFoundError("Bracket does not exist!");
  }

  const pick = await Pick.findOne({ bracketId, userId }).lean();
  if (!pick) {
    throw new NotFoundError("Pick does not exist!");
  }

  const { homeId, awayId, tournamentId } = bracket;

  let homePicks = await Pick.find({
    playerId: homeId,
    bracketId: bracket._id,
  }).lean();
  let awayPicks = await Pick.find({
    playerId: awayId,
    bracketId: bracket._id,
  }).lean();

  const homeVotes = homePicks.length > 0 ? homePicks.length : 1;
  const awayVotes = awayPicks.length > 0 ? awayPicks.length : 1;

  const match = await Match.findOne({ homeId, awayId, tournamentId }).lean();
  if (match.status === "pending") {
    throw new BadRequestError("Result for this match is not available yet!");
  }

  if (pick.isVerified) {
    throw new BadRequestError("Pick has been already verified!");
  }

  const tournament = await Tournament.findOne({
    id: match.tournamentId,
  }).lean();
  if (!tournament) {
    throw new NotFoundError("Tournament does not exist!");
  }

  const week = await Week.findOne({ _id: tournament.weekId }).lean();
  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const updatedPick = await Pick.findOneAndUpdate(
    { bracketId, userId },
    { isVerified: true },
    { runValidators: true, new: true }
  );

  if (pick.playerId === bracket.winnerId) {
    let pickPoints = 0;

    if (pick.playerId === homeId) {
      pickPoints = awayVotes;
    } else if (pick.playerId === awayId) {
      pickPoints = homeVotes;
    }

    const userWeek = await UserWeek.findOne({
      userId,
      weekId: week._id,
    }).lean();
    if (!userWeek) {
      throw new NotFoundError("User week does not exist!");
    }

    await UserWeek.findOneAndUpdate(
      { userId, weekId: week._id },
      { bracketPoints: userWeek.bracketPoints + pickPoints },
      { runValidators: true }
    );
  }

  res.status(StatusCodes.OK).json({ updatedPick });
};

const calculateWeeklyBracketPoints = async (req, res) => {
  const { weekId } = req.body;
  const { userId } = req.user;

  const week = await Week.findOne({ _id: weekId }).lean();

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const start = new Date(week.from);
  const end = new Date(week.to);
  const twoHours = 1000 * 60 * 60 * 2;
  const current = new Date(Date.now() + twoHours);

  // UNCOMMENT IN PRODUCTION

  // if (!(current >= start && current <= end)) {
  //   throw new BadRequestError("You cannot update points for this week yet!");
  // }

  let tournaments = await Tournament.find({ weekId }).lean();
  tournaments = tournaments.filter(
    (t) => current >= new Date(t.startDate) && current <= new Date(t.endDate)
  );

  let weeklyPoints = 0;

  for (let i = 0; i < tournaments.length; i++) {
    const tournament = tournaments[i];
    const { id } = tournament;

    const brackets = await Bracket.find({ tournamentId: id }).lean();

    for (let j = 0; j < brackets.length; j++) {
      const bracket = brackets[j];
      const { winnerId, _id, roundId } = bracket;

      const round = await Round.findOne({ _id: roundId });

      if (!round) {
        throw new NotFoundError("Round not found!");
      }

      const { name: roundName } = round;

      const picks = await Pick.find({ userId, bracketId: _id }).lean();

      for (let k = 0; k < picks.length; k++) {
        const pick = picks[k];
        const { playerId } = pick;

        if (playerId === winnerId) {
          switch (roundName) {
            case "1/64 finals":
              weeklyPoints += 5;
              break;
            case "1/32 finals":
              weeklyPoints += 10;
              break;
            case "1/16 finals":
              weeklyPoints += 20;
              break;
            case "1/8 finals":
              weeklyPoints += 40;
              break;
            case "1/4 finals":
              weeklyPoints += 80;
              break;
            case "1/2 finals":
              weeklyPoints += 160;
              break;
            case "final":
              weeklyPoints += 320;
              break;

            default:
              throw new NotFoundError("Invalid round name!");
          }
        }
      }
    }

    const userWeek = await UserWeek.findOneAndUpdate(
      { userId, weekId },
      { bracketPoints: weeklyPoints },
      { runValidators: true, new: true }
    );

    if (!userWeek) {
      throw new NotFoundError("User week does not exist!");
    }

    res.status(StatusCodes.OK).json({ userWeek, weeklyPoints });
  }
};

const getWeeklyBracketPoints = async (req, res) => {
  const { weekId, email } = req.query;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const userWeek = await UserWeek.findOne({ userId, weekId }).lean();

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  const { bracketPoints } = userWeek;

  res.status(StatusCodes.OK).json({ bracketPoints });
};

const calculateTotalBracketPoints = async (req, res) => {
  const { email } = req.query;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const twoHours = 1000 * 60 * 60 * 2;
  const currentDate = new Date(Date.now() + twoHours);
  const userWeeks = await UserWeek.find({ userId }).lean();
  let totalBracketPoints = 0;

  for (let i = 0; i < userWeeks.length; i++) {
    const userWeek = userWeeks[i];
    const { bracketPoints } = userWeek;

    totalBracketPoints += bracketPoints;
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { bracketPoints: totalBracketPoints },
    { runValidators: true, new: true }
  );

  if (!updatedUser) {
    throw new NotFoundError("User does not exist!");
  }

  res.status(StatusCodes.OK).json({ updatedUser, totalBracketPoints });
};

const getTotalBracketPoints = async (req, res) => {
  const { email } = req.query;

  console.log("hey");

  const user = await User.findOne({ email }).lean();

  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { bracketPoints } = user;

  res.status(StatusCodes.OK).json({ bracketPoints });
};

module.exports = {
  havePickBeenMade,
  getAllByUserAndByTournament,
  createPick,
  verifyPick,
  calculateWeeklyBracketPoints,
  calculateTotalBracketPoints,
  getWeeklyBracketPoints,
  getTotalBracketPoints,
};
