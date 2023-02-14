const Player = require("../models/Player");
const UserPlayer = require("../models/UserPlayer");
const UserWeek = require("../models/UserWeek");
const Week = require("../models/Week");
const Match = require("../models/Match");
const User = require("../models/User");
const Tournament = require("../models/Tournament");
const Favorite = require("../models/Favorite");
const UserMatchPlayer = require("../models/UserMatchPlayer");

const pointsSystem = require("../utils/pointsSystem");
const parseDate = require("../utils/parseDate");

const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");
const { NotFoundError } = require("../errors");
const Country = require("../models/Country");

const createPlayer = async (req, res) => {
  const players = await Player.find({}).sort("id").lean();
  const player = await Player.create({
    ...req.body,
    id: players[players.length - 1].id + 1,
  });
  res.status(StatusCodes.CREATED).json({ player });
};

const updatePlayer = async (req, res) => {
  const { id } = req.params;
  const { inputModel } = req.body;

  const player = await Player.findOne({ id: inputModel.id }).lean();

  if (!player) {
    throw new NotFoundError(`Not found player with id: ${id}`);
  }

  await Player.findOneAndUpdate({ id: inputModel.id }, { ...inputModel });

  res.status(StatusCodes.OK).send();
};

const getAll = async (req, res) => {
  let players = await Player.find({}).sort("ranking").lean();

  const countries = await Country.find({}).lean();

  players = players.slice(0, 100).map((player) => {
    const country = countries.find(
      (c) => c.name.toLowerCase() === player.country.toLowerCase()
    );

    if (country) {
      return {
        ...player,
        countryKey: country.key,
      };
    }

    return player;
  });

  res.status(StatusCodes.OK).json({ players });
};

const getAllPlayers = async (req, res) => {
  const { playerSearchTerm, isBought, selected, page, itemsPerPage, email } =
    req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  let players = await Player.find({}).sort("ranking").lean();
  players = players.slice(0, 100);

  const userPlayers = await UserPlayer.find({
    weekId: selected.value,
    userId: user._id,
  }).lean();
  let boughtPlayers = [];

  for (let i = 0; i < userPlayers.length; i++) {
    const player = players.find((p) => p.id === userPlayers[i].playerId);
    boughtPlayers.push(player);
  }

  if (isBought) {
    players = boughtPlayers;
  }

  if (playerSearchTerm) {
    players = players.filter((p) =>
      p.name.toLowerCase().includes(playerSearchTerm.toLowerCase())
    );
  }

  const totalItems = players.length;

  // const start = (page - 1) * itemsPerPage;
  // const end = start + itemsPerPage;
  // players = players.slice(start, end);

  res.status(StatusCodes.OK).json({ players, totalItems });
};

const getAllPlayersInTeam = async (req, res) => {
  const { selected } = req.body;
  const { email } = req.query;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  let players = await Player.find({}).sort("ranking").lean();
  const userPlayers = await UserPlayer.find({
    weekId: selected.value,
    userId: user._id,
    isSubstitution: false,
  }).lean();

  let boughtPlayers = [];

  for (let i = 0; i < userPlayers.length; i++) {
    const player = players.find((p) => p.id === userPlayers[i].playerId);
    boughtPlayers.push({
      _id: player._id,
      id: player.id,
      name: player.name,
      country: player.country,
      points: player.points,
      ranking: player.ranking,
      price: player.price,
      imageUrl: player.imageUrl,
      gender: player.gender,
      pointsWon: userPlayers[i].pointsWon,
      balls: userPlayers[i].balls,
    });
  }

  players = boughtPlayers;

  res.status(StatusCodes.OK).json({ players });
};

const getAllSubstitutionsInTeam = async (req, res) => {
  const { selected } = req.body;
  const { email } = req.query;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  let players = await Player.find({}).sort("ranking").lean();
  const userPlayers = await UserPlayer.find({
    weekId: selected.value,
    userId: user._id,
    isSubstitution: true,
  }).lean();

  let boughtPlayers = [];

  for (let i = 0; i < userPlayers.length; i++) {
    const player = players.find((p) => p.id === userPlayers[i].playerId);
    boughtPlayers.push({
      _id: player._id,
      id: player.id,
      name: player.name,
      country: player.country,
      points: player.points,
      ranking: player.ranking,
      price: player.price,
      imageUrl: player.imageUrl,
      gender: player.gender,
      pointsWon: userPlayers[i].pointsWon,
      balls: userPlayers[i].balls,
    });
  }

  players = boughtPlayers;

  res.status(StatusCodes.OK).json({ players });
};

const getSinglePlayer = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError("Provide player id");
  }

  const player = await Player.findOne({ id: Number(id) }).lean();
  const country = await Country.findOne({
    name: { $eq: player.country },
  }).lean();

  if (!player) {
    throw new NotFoundError("Player does not exist");
  }

  res.status(StatusCodes.OK).json({
    player: {
      ...player,
      countryKey: country.key,
    },
  });
};

const getSinglePlayerMatches = async (req, res) => {
  const { skipMatchId, playerId, surface } = req.body;
  const { id } = req.params;
  const { userId } = req.user;
  let matches = await Match.find({
    $or: [
      { homeId: { $eq: id } },
      {
        awayId: { $eq: id },
      },
    ],
  }).lean();

  const players = await Player.find({}).lean();
  const favorites = await Favorite.find({}).lean();
  const tournaments = await Tournament.find({}).lean();
  const player = players.find((player) => player.id === Number(id));

  matches = matches.map((match) => {
    const homePlayer = players.find((player) => player.id === match.homeId);
    const awayPlayer = players.find((player) => player.id === match.awayId);
    const tournament = tournaments.find(
      (tournament) => tournament.id === match.tournamentId
    );

    const favoriteId = favorites.find(
      (favorite) => favorite.matchId === match.id && favorite.userId === userId
    )?._id;
    return {
      ...match,
      tournament: { ...tournament },
      homePlayer: { ...homePlayer },
      awayPlayer: { ...awayPlayer },
      favoriteId,
    };
  });

  res.status(StatusCodes.OK).json({ player, matches });
};

const addPlayerInTeam = async (req, res) => {
  const { playerId, weekId, email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const week = await Week.findOne({ _id: weekId }).lean();

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const start = new Date(week.from);
  const current = new Date();

  if (current >= start) {
    throw new BadRequestError("Deadline passed!");
  }

  const userPlayers = await UserPlayer.find({
    weekId,
    userId,
  }).lean();

  if (userPlayers.length >= 12) {
    throw new BadRequestError("Your team is full!");
  }

  const userPlayer = await UserPlayer.findOne({
    playerId,
    weekId,
    userId,
  }).lean();

  if (userPlayer) {
    throw new BadRequestError("Player is already present in your team!");
  }

  const player = await Player.findOne({ id: playerId }).lean();
  const userWeek = await UserWeek.findOne({ userId, weekId }).lean();

  if (player.price > userWeek.balance) {
    throw new BadRequestError(
      "You do not have enough money to buy this player!"
    );
  }

  const starters = await UserPlayer.find({
    userId,
    weekId,
    isSubstitution: false,
  }).lean();

  const isSubstitution = starters.length >= 8;

  const playerInTeam = await UserPlayer.create({
    playerId,
    weekId,
    userId,
    pointsWon: 0,
    balls: 1,
    isSubstitution,
  });

  await UserWeek.findOneAndUpdate(
    { userId, weekId },
    { balance: userWeek.balance - player.price },
    { runValidators: true }
  );

  res
    .status(StatusCodes.CREATED)
    .json({ playerInTeam, msg: "Player added successfully to your team!" });
};

const performSubstitution = async (req, res) => {
  const { substitutionId, starterId, weekId, email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  if (user.trades <= 0) {
    throw new BadRequestError("You don't have trades anymore!");
  }

  const week = await Week.findOne({ _id: weekId }).lean();

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const end = new Date(week.to);
  const current = new Date();

  if (current >= end) {
    throw new BadRequestError("Deadline passed!");
  }

  const starter = await UserPlayer.findOneAndUpdate(
    { userId, weekId, playerId: starterId },
    { isSubstitution: true },
    { runValidators: true, new: true }
  );

  if (!starter) {
    throw new NotFoundError("Starter does not exist!");
  }

  const substitution = await UserPlayer.findOneAndUpdate(
    { userId, weekId, playerId: substitutionId },
    {
      isSubstitution: false,
      balls: starter.balls,
      pointsWon: starter.pointsWon,
    },
    { runValidators: true, new: true }
  );

  if (!substitution) {
    throw new NotFoundError("Substitution does not exist!");
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { trades: user.trades - 1 },
    { runValidators: true, new: true }
  );

  res.status(StatusCodes.OK).json({ substitution, starter, updatedUser });
};

const deletePlayerInTeam = async (req, res) => {
  const { playerId, weekId, email } = req.query;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const week = await Week.findOne({ _id: weekId }).lean();

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const start = new Date(week.from);
  const current = new Date();

  if (current >= start) {
    throw new BadRequestError("Deadline passed!");
  }

  const userPlayer = await UserPlayer.findOneAndRemove({
    playerId,
    weekId,
    userId,
  });

  if (!userPlayer) {
    throw new NotFoundError("User player does not exist!");
  }

  const player = await Player.findOne({ id: playerId }).lean();
  const userWeek = await UserWeek.findOne({ userId, weekId }).lean();

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  await UserWeek.findOneAndUpdate(
    { userId, weekId },
    {
      balance: userWeek.balance + player.price,
      balls: userWeek.balls + (userPlayer.balls - 1),
      points: userWeek.points - userPlayer.pointsWon,
    },
    { runValidators: true }
  );

  await User.findOneAndUpdate(
    { _id: userId },
    { points: user.points - userPlayer.pointsWon },
    { runValidators: true }
  );

  res.status(StatusCodes.OK).send();
};

const addBallToUserPlayer = async (req, res) => {
  const { playerId, weekId, email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const week = await Week.findOne({ _id: weekId }).lean();

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const start = new Date(week.from);
  const current = new Date();

  if (current >= start) {
    throw new BadRequestError("Deadline passed!");
  }

  const userWeek = await UserWeek.findOne({ weekId, userId }).lean();

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  if (userWeek.balls <= 0) {
    throw new BadRequestError("You do not have tennis balls anymore!");
  }

  const oldUserPlayer = await UserPlayer.findOne({
    playerId,
    weekId,
    userId,
  }).lean();

  if (!oldUserPlayer) {
    throw new NotFoundError("User player does not exist!");
  }

  if (oldUserPlayer.balls >= 3) {
    throw new BadRequestError("Max. tennis balls per player is 3!");
  }

  const userPlayer = await UserPlayer.findOneAndUpdate(
    {
      playerId,
      weekId,
      userId,
    },
    { balls: oldUserPlayer.balls + 1 },
    { runValidators: true, new: true }
  );

  await UserWeek.findOneAndUpdate(
    { weekId, userId },
    { balls: userWeek.balls - 1 },
    { runValidators: true }
  );

  res.status(StatusCodes.OK).json({ userPlayer });
};

const deleteBallFromUserPlayer = async (req, res) => {
  const { playerId, weekId, email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const week = await Week.findOne({ _id: weekId }).lean();

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }
  const start = new Date(week.from);
  const current = new Date();

  if (current >= start) {
    throw new BadRequestError("Deadline passed!");
  }

  const oldUserPlayer = await UserPlayer.findOne({
    playerId,
    weekId,
    userId,
  }).lean();

  if (!oldUserPlayer) {
    throw new NotFoundError("User player does not exist!");
  }

  if (oldUserPlayer.balls <= 1) {
    throw new BadRequestError("Min. tennis balls per player is 1!");
  }

  const userPlayer = await UserPlayer.findOneAndUpdate(
    {
      playerId,
      weekId,
      userId,
    },
    { balls: oldUserPlayer.balls - 1 },
    { runValidators: true, new: true }
  );

  const userWeek = await UserWeek.findOne({ weekId, userId }).lean();

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  await UserWeek.findOneAndUpdate(
    { weekId, userId },
    { balls: userWeek.balls + 1 },
    { runValidators: true }
  );

  res.status(StatusCodes.OK).json({ userPlayer });
};

const calculatePointsForUserPlayers = async (req, res) => {
  const { weekId, email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const week = await Week.findOne({ _id: weekId }).lean();

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const start = new Date(week.from);
  const end = new Date(week.to);
  const current = new Date();

  // UNCOMMENT IN PRODUCTION

  if (!(current >= start && current <= end)) {
    throw new BadRequestError("You cannot update points for this week yet!");
  }

  const userPlayers = await UserPlayer.find({
    weekId,
    userId,
    isSubstitution: false,
  }).lean();
  let weeklyPoints = 0;

  for (let i = 0; i < userPlayers.length; i++) {
    const userPlayer = userPlayers[i];
    const { _id, balls, playerId, pointsWon } = userPlayer;

    const userMatchPlayers = await UserMatchPlayer.find({
      userId,
      playerId,
    }).lean();

    let homeMatches = await Match.find({
      homeId: userPlayer.playerId,
      round: "n/a",
      status: "finished",
    }).lean();

    let awayMatches = await Match.find({
      awayId: userPlayer.playerId,
      round: "n/a",
      status: "finished",
    }).lean();

    homeMatches = homeMatches.filter(
      (m) =>
        !userMatchPlayers.some((ump) => ump.matchId === m.id) &&
        new Date(m.date) >= start &&
        new Date(m.date) <= end
    );

    awayMatches = awayMatches.filter(
      (m) =>
        !userMatchPlayers.some((ump) => ump.matchId === m.id) &&
        new Date(m.date) >= start &&
        new Date(m.date) <= end
    );

    let homePoints = 0;
    let awayPoints = 0;

    for (let j = 0; j < homeMatches.length; j++) {
      const homeMatch = homeMatches[j];
      await UserMatchPlayer.create({ userId, playerId, matchId: homeMatch.id });

      let {
        homeSets,
        homeSet1,
        homeSet2,
        homeSet3,
        homeSet4,
        homeSet5,
        homeAces,
        homeUnforcedErrors,
        homeDoubleFaults,
        homeWinners,
      } = homeMatch;

      if (homeSet3 === "n/a") {
        homeSet3 = 0;
      }

      if (homeSet4 === "n/a") {
        homeSet4 = 0;
      }

      if (homeSet5 === "n/a") {
        homeSet5 = 0;
      }

      const pointsForWin =
        homeMatch.winnerId === userPlayer.playerId ? pointsSystem.MATCH : 0;

      homePoints +=
        Number(homeSets) * pointsSystem.SET +
        Number(homeSet1) * pointsSystem.GAME +
        Number(homeSet2) * pointsSystem.GAME +
        Number(homeSet3) * pointsSystem.GAME +
        Number(homeSet4) * pointsSystem.GAME +
        Number(homeSet5) * pointsSystem.GAME +
        Number(homeAces) * pointsSystem.ACE +
        Number(homeUnforcedErrors) * pointsSystem.UNFORCED_ERROR +
        Number(homeDoubleFaults) * pointsSystem.DOUBLE_FAULT +
        Number(homeWinners) * pointsSystem.WINNER +
        pointsForWin;
    }

    for (let j = 0; j < awayMatches.length; j++) {
      const awayMatch = awayMatches[j];
      await UserMatchPlayer.create({ userId, playerId, matchId: awayMatch.id });

      let {
        awaySets,
        awaySet1,
        awaySet2,
        awaySet3,
        awaySet4,
        awaySet5,
        awayAces,
        awayUnforcedErrors,
        awayDoubleFaults,
        awayWinners,
      } = awayMatch;

      if (awaySet3 === "n/a") {
        awaySet3 = 0;
      }

      if (awaySet4 === "n/a") {
        awaySet4 = 0;
      }

      if (awaySet5 === "n/a") {
        awaySet5 = 0;
      }

      const pointsForWin =
        awayMatch.winnerId === userPlayer.playerId ? pointsSystem.MATCH : 0;

      awayPoints +=
        Number(awaySets) * pointsSystem.SET +
        Number(awaySet1) * pointsSystem.GAME +
        Number(awaySet2) * pointsSystem.GAME +
        Number(awaySet3) * pointsSystem.GAME +
        Number(awaySet4) * pointsSystem.GAME +
        Number(awaySet5) * pointsSystem.GAME +
        Number(awayAces) * pointsSystem.ACE +
        Number(awayUnforcedErrors) * pointsSystem.UNFORCED_ERROR +
        Number(awayDoubleFaults) * pointsSystem.DOUBLE_FAULT +
        Number(awayWinners) * pointsSystem.WINNER +
        pointsForWin;
    }

    const totalPoints = (homePoints + awayPoints) * balls;
    weeklyPoints += totalPoints;

    await UserPlayer.findOneAndUpdate(
      { _id },
      { pointsWon: totalPoints + pointsWon },
      { runValidators: true }
    );
  }

  const userWeek = await UserWeek.findOne({ userId, weekId }).lean();
  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  const updatedUserWeek = await UserWeek.findOneAndUpdate(
    { userId, weekId },
    { points: userWeek.points + weeklyPoints },
    { runValidators: true, new: true }
  );

  res.status(StatusCodes.OK).json({ updatedUserWeek, weeklyPoints });
};

const calculateTotalPoints = async (req, res) => {
  const { email } = req.query;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { _id: userId } = user;

  const userPlayers = await UserPlayer.find({
    userId,
    isSubstitution: false,
  }).lean();
  let totalPoints = 0;

  for (let i = 0; i < userPlayers.length; i++) {
    const userPlayer = userPlayers[i];
    const { pointsWon } = userPlayer;

    totalPoints += pointsWon;
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { points: totalPoints },
    { runValidators: true, new: true }
  );

  if (!updatedUser) {
    throw new NotFoundError("User does not exist!");
  }

  res.status(StatusCodes.OK).json({ updatedUser, totalPoints });
};

const getWeeklyPoints = async (req, res) => {
  const { weekId } = req.query;
  const { userId } = req.user;

  const userWeek = await UserWeek.findOne({ userId, weekId }).lean();

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  const { points } = userWeek;

  res.status(StatusCodes.OK).json({ points });
};

const getTotalPoints = async (req, res) => {
  const { email } = req.query;

  const user = await User.findOne({ email }).lean();

  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { points } = user;

  res.status(StatusCodes.OK).json({ points });
};

module.exports = {
  createPlayer,
  updatePlayer,
  getAll,
  getAllPlayers,
  getAllPlayersInTeam,
  getAllSubstitutionsInTeam,
  getSinglePlayer,
  getSinglePlayerMatches,
  addPlayerInTeam,
  performSubstitution,
  deletePlayerInTeam,
  addBallToUserPlayer,
  deleteBallFromUserPlayer,
  calculatePointsForUserPlayers,
  calculateTotalPoints,
  getWeeklyPoints,
  getTotalPoints,
};
