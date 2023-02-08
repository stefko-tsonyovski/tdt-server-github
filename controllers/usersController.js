const User = require("../models/User");
const UserPlayer = require("../models/UserPlayer");
const UserWeek = require("../models/UserWeek");
const Player = require("../models/Player");
const League = require("../models/League");

const { NotFoundError } = require("../errors");
const { StatusCodes } = require("http-status-codes");

const getAllUsers = async (req, res) => {
  const users = await User.find({ role: "user" }).lean();
  res.status(StatusCodes.OK).json({ users });
};

const getTop200Users = async (req, res) => {
  let users = await User.find({ role: "user" }).lean();
  users = users
    .sort((a, b) => {
      const {
        points: pointsA,
        bracketPoints: bracketPointsA,
        socialPoints: socialPointsA,
        leaguePoints: leaguePointsA,
        predictionPoints: predictionPointsA,
        firstName: firstNameA,
        lastName: lastNameA,
      } = a;
      const {
        points: pointsB,
        bracketPoints: bracketPointsB,
        socialPoints: socialPointsB,
        leaguePoints: leaguePointsB,
        predictionPoints: predictionPointsB,
        firstName: firstNameB,
        lastName: lastNameB,
      } = b;

      const totalPointsA =
        pointsA +
        bracketPointsA +
        socialPointsA +
        leaguePointsA +
        predictionPointsA;
      const totalPointsB =
        pointsB +
        bracketPointsB +
        socialPointsB +
        leaguePointsB +
        predictionPointsB;

      const fullNameA = firstNameA + lastNameA;
      const fullNameB = firstNameB + lastNameB;

      if (totalPointsA > totalPointsB) {
        return -1;
      } else if (totalPointsA < totalPointsB) {
        return 1;
      } else {
        if (fullNameA > fullNameB) {
          return 1;
        } else {
          return -1;
        }
      }
    })
    .slice(0, 200)
    .map((user, index) => {
      const {
        points,
        bracketPoints,
        socialPoints,
        leaguePoints,
        predictionPoints,
      } = user;

      const resultUser = {
        ...user,
        position: index + 1,
        totalPoints:
          points +
          bracketPoints +
          socialPoints +
          leaguePoints +
          predictionPoints,
      };

      return resultUser;
    });

  res.status(StatusCodes.OK).json({ users });
};

const getUsersByLeague = async (req, res) => {
  const { leagueId } = req.params;
  const { searchTerm } = req.query;

  const league = await League.findOne({ _id: leagueId }).lean();

  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  let users = await User.find({ role: "user", leagueId }).lean();

  if (searchTerm) {
    users = users.filter((u) =>
      (u.firstName + " " + u.lastName)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }

  users = users
    .sort((a, b) => {
      const {
        points: pointsA,
        bracketPoints: bracketPointsA,
        socialPoints: socialPointsA,
        leaguePoints: leaguePointsA,
        predictionPoints: predictionPointsA,
        firstName: firstNameA,
        lastName: lastNameA,
      } = a;
      const {
        points: pointsB,
        bracketPoints: bracketPointsB,
        socialPoints: socialPointsB,
        leaguePoints: leaguePointsB,
        predictionPoints: predictionPointsB,
        firstName: firstNameB,
        lastName: lastNameB,
      } = b;

      const totalPointsA =
        pointsA +
        bracketPointsA +
        socialPointsA +
        leaguePointsA +
        predictionPointsA;
      const totalPointsB =
        pointsB +
        bracketPointsB +
        socialPointsB +
        leaguePointsB +
        predictionPointsB;

      const fullNameA = firstNameA + lastNameA;
      const fullNameB = firstNameB + lastNameB;

      if (totalPointsA > totalPointsB) {
        return -1;
      } else if (totalPointsA < totalPointsB) {
        return 1;
      } else {
        if (fullNameA > fullNameB) {
          return 1;
        } else {
          return -1;
        }
      }
    })
    .slice(0, 200)
    .map((user, index) => {
      const {
        points,
        bracketPoints,
        socialPoints,
        leaguePoints,
        predictionPoints,
      } = user;

      const resultUser = {
        ...user,
        position: index + 1,
        totalPoints:
          points +
          bracketPoints +
          socialPoints +
          leaguePoints +
          predictionPoints,
        leagueCreatorId: league.creatorId,
      };

      return resultUser;
    });

  res.status(StatusCodes.OK).json({
    users,
    leagueName: league.name,
    leagueCreatorId: league.creatorId,
  });
};

const getCurrentUserPosition = async (req, res) => {
  const { userId } = req.user;
  console.log(userId);
  let users = await User.find({ role: "user" }).lean();
  users = users
    .sort((a, b) => {
      const {
        points: pointsA,
        bracketPoints: bracketPointsA,
        socialPoints: socialPointsA,
        leaguePoints: leaguePointsA,
        predictionPoints: predictionPointsA,
        firstName: firstNameA,
        lastName: lastNameA,
      } = a;
      const {
        points: pointsB,
        bracketPoints: bracketPointsB,
        socialPoints: socialPointsB,
        leaguePoints: leaguePointsB,
        predictionPoints: predictionPointsB,
        firstName: firstNameB,
        lastName: lastNameB,
      } = b;

      const totalPointsA =
        pointsA +
        bracketPointsA +
        socialPointsA +
        leaguePointsA +
        predictionPointsA;
      const totalPointsB =
        pointsB +
        bracketPointsB +
        socialPointsB +
        leaguePointsB +
        predictionPointsB;

      const fullNameA = firstNameA + lastNameA;
      const fullNameB = firstNameB + lastNameB;

      if (totalPointsA > totalPointsB) {
        return -1;
      } else if (totalPointsA < totalPointsB) {
        return 1;
      } else {
        if (fullNameA > fullNameB) {
          return 1;
        } else {
          return -1;
        }
      }
    })
    .map((user, index) => {
      const {
        points,
        bracketPoints,
        socialPoints,
        leaguePoints,
        predictionPoints,
      } = user;

      const resultUser = {
        ...user,
        position: index + 1,
        totalPoints:
          points +
          bracketPoints +
          socialPoints +
          leaguePoints +
          predictionPoints,
      };

      return resultUser;
    });

  const currentUser = await User.findOne({ _id: userId }).lean();

  const result = users.find(
    (u) => u._id.toString() === currentUser._id.toString()
  );

  if (result.leagueId) {
    const leagues = await League.find({}).sort("-points").lean();
    const league = await League.findOne({ _id: currentUser.leagueId }).lean();

    const leagueIndex = league
      ? leagues.findIndex((l) => l.name === league.name)
      : -1;

    res.status(StatusCodes.OK).json({
      ...result,
      leaguePosition: leagueIndex + 1,
      leagueId: league?._id,
    });
  }

  res.status(StatusCodes.OK).json({
    ...result,
  });
};

const getUser = async (req, res) => {
  const { id } = req.params;

  const user = await User.findOne({ _id: id }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  res.status(StatusCodes.OK).json({ user });
};

const getTeamByUserAndByWeek = async (req, res) => {
  const { userId, weekId } = req.query;

  let players = await Player.find({}).sort("ranking").lean();
  const userPlayers = await UserPlayer.find({
    userId,
    weekId,
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

const getWeeklyPointsByUser = async (req, res) => {
  const { userId, weekId } = req.query;

  const userWeek = await UserWeek.findOne({ userId, weekId }).lean();

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  const { points } = userWeek;

  res.status(StatusCodes.OK).json({ points });
};

const getTotalPointsByUser = async (req, res) => {
  const { userId } = req.query;

  const user = await User.findOne({ _id: userId }).lean();

  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { points } = user;

  res.status(StatusCodes.OK).json({ points });
};

const getTradesByUser = async (req, res) => {
  const { userId } = req.user;

  const user = await User.findOne({ _id: userId }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  res.status(StatusCodes.OK).json({ trades: user.trades });
};

module.exports = {
  getAllUsers,
  getTop200Users,
  getUsersByLeague,
  getCurrentUserPosition,
  getTeamByUserAndByWeek,
  getWeeklyPointsByUser,
  getTotalPointsByUser,
  getTradesByUser,
  getUser,
};
