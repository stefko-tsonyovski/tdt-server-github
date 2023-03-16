const Bracket = require("../models/Bracket");
const Tournament = require("../models/Tournament");
const Round = require("../models/Round");
const Player = require("../models/Player");
const Match = require("../models/Match");
const Pick = require("../models/Pick");

const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");

const getAllBrackets = async (req, res) => {
  const brackets = await Bracket.find({}).lean();
  res.status(StatusCodes.OK).json({ brackets });
};

const getAllBracketsByTournamentId = async (req, res) => {
  const { tournamentId } = req.query;

  const brackets = await Bracket.find({
    tournamentId: Number(tournamentId),
  }).lean();
  res.status(StatusCodes.OK).json({ brackets });
};

const getAllBracketsByTournamentIdAndRoundId = async (req, res) => {
  const { tournamentId, roundId, page, itemsPerPage } = req.query;

  console.log(page, itemsPerPage);

  let brackets = await Bracket.find({
    tournamentId: Number(tournamentId),
    roundId,
  }).lean();

  const totalItems = brackets.length;

  const start = (Number(page) - 1) * Number(itemsPerPage);
  const end = start + Number(itemsPerPage);
  brackets = brackets.slice(start, end);

  let resultBrackets = [];

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];

    const { homeId, awayId } = bracket;

    let homePicks = await Pick.find({
      playerId: homeId,
      bracketId: bracket._id,
    }).lean();
    let awayPicks = await Pick.find({
      playerId: awayId,
      bracketId: bracket._id,
    }).lean();

    const homeVotes = homePicks.length;
    const awayVotes = awayPicks.length;

    const homePlayer = await Player.findOne({ id: bracket.homeId }).lean();
    const awayPlayer = await Player.findOne({ id: bracket.awayId }).lean();

    const finalBracket = {
      ...bracket,
      homePlayer,
      awayPlayer,
      homeVotes,
      awayVotes,
    };

    resultBrackets.push(finalBracket);
  }

  console.log(resultBrackets);

  res.status(StatusCodes.OK).json({ brackets: resultBrackets, totalItems });
};

const createBracket = async (req, res) => {
  const { connectedBracketId } = req.body;

  const bracketsByConnectedId = await Bracket.find({
    connectedBracketId,
  }).lean();

  if (connectedBracketId && bracketsByConnectedId.length >= 2) {
    throw new BadRequestError(
      "You cannot have more than 2 brackets attached to a given bracket!"
    );
  }

  const bracket = await Bracket.create({ ...req.body });
  res.status(StatusCodes.CREATED).json({ bracket });
};

const getBracket = async (req, res) => {
  const { id } = req.params;

  const bracket = await Bracket.findOne({ _id: id }).lean();

  if (!bracket) {
    throw new NotFoundError("Bracket does not exist!");
  }

  const tournament = await Tournament.findOne({
    id: bracket.tournamentId,
  }).lean();

  if (!tournament) {
    throw new NotFoundError("Tournament does not exist!");
  }

  const round = await Round.findOne({ _id: bracket.roundId }).lean();

  if (!round) {
    throw new NotFoundError("Round does not exist!");
  }

  const homePlayer = await Player.findOne({ id: bracket.homeId }).lean();

  const awayPlayer = await Player.findOne({ id: bracket.awayId }).lean();

  const winnerPlayer = await Player.findOne({ id: bracket.winnerId }).lean();

  console.log(bracket);

  res.status(StatusCodes.OK).json({
    bracket,
    tournament,
    round,
    homePlayer,
    awayPlayer,
    winnerPlayer,
  });
};

const updateBracket = async (req, res) => {
  const { name, homeName, awayName, date, tournamentName, roundName } =
    req.body;

  const homePlayer = await Player.findOne({ name: homeName }).lean();
  if (!homePlayer) {
    throw new NotFoundError("Home player does not exist!");
  }

  const awayPlayer = await Player.findOne({ name: awayName }).lean();
  if (!awayPlayer) {
    throw new NotFoundError("Away player does not exist!");
  }

  const tournament = await Tournament.findOne({
    name: tournamentName,
    season: 2023,
  }).lean();
  if (!tournament) {
    throw new NotFoundError("Tournament does not exist!");
  }

  const round = await Round.findOne({ name: roundName }).lean();
  if (!round) {
    throw new NotFoundError("Round does not exist!");
  }

  const bracket = await Bracket.findOneAndUpdate(
    {
      name,
      tournamentId: tournament.id,
      roundId: round._id,
    },
    {
      date,
      homeId: homePlayer.id,
      awayId: awayPlayer.id,
      tournamentId: tournament.id,
      roundId: round._id,
    },
    { runValidators: true, new: true }
  );

  if (!bracket) {
    throw new NotFoundError("Bracket does not exist!");
  }

  const matches = await Match.find({}).sort("id").lean();

  const match = await Match.create({
    id: matches.length ? matches[matches.length - 1].id + 1 : 1,
    status: "pending",
    homeId: homePlayer.id,
    awayId: awayPlayer.id,
    date,
    tournamentId: tournament.id,
    roundId: round._id,
  });

  res.status(StatusCodes.OK).json({ bracket, match });
};

const updateFinishedBracket = async (req, res) => {
  const {
    name,
    tournamentName,
    roundName,
    winnerName,
    homeSets,
    awaySets,
    homeSet1,
    homeSet2,
    homeSet3,
    homeSet4,
    homeSet5,
    awaySet1,
    awaySet2,
    awaySet3,
    awaySet4,
    awaySet5,
    homeAces,
    homeDoubleFaults,
    homeWinners,
    homeUnforcedErrors,
    awayAces,
    awayDoubleFaults,
    awayWinners,
    awayUnforcedErrors,
  } = req.body;

  // Notification -

  const winner = await Player.findOne({ name: winnerName }).lean();
  if (!winner) {
    throw new NotFoundError("Winner does not exist!");
  }

  const tournament = await Tournament.findOne({
    name: tournamentName,
    season: 2023,
  }).lean();

  if (!tournament) {
    throw new NotFoundError("Tournament does not exist!");
  }

  const round = await Round.findOne({ name: roundName }).lean();
  if (!round) {
    throw new NotFoundError("Round does not exist!");
  }

  const bracket = await Bracket.findOneAndUpdate(
    {
      name,
      tournamentId: tournament.id,
      roundId: round._id,
    },
    { winnerId: winner.id },
    { runValidators: true, new: true }
  );

  if (!bracket) {
    throw new NotFoundError("Bracket does not exist!");
  }

  const match = await Match.findOneAndUpdate(
    {
      homeId: bracket.homeId,
      awayId: bracket.awayId,
      tournamentId: tournament.id,
      roundId: round._id,
    },
    {
      winnerId: winner.id,
      status: "finished",
      homeSets,
      awaySets,
      homeSet1,
      homeSet2,
      homeSet3,
      homeSet4,
      homeSet5,
      awaySet1,
      awaySet2,
      awaySet3,
      awaySet4,
      awaySet5,
      homeAces,
      homeDoubleFaults,
      homeWinners,
      homeUnforcedErrors,
      awayAces,
      awayDoubleFaults,
      awayWinners,
      awayUnforcedErrors,
    },
    { runValidators: true, new: true }
  );

  // Favorites by matchId

  res.status(StatusCodes.OK).json({ bracket, match });
};

module.exports = {
  getAllBrackets,
  getAllBracketsByTournamentId,
  getAllBracketsByTournamentIdAndRoundId,
  createBracket,
  getBracket,
  updateBracket,
  updateFinishedBracket,
};
