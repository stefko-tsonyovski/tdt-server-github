const { NotFoundError } = require("../errors/index");
const { StatusCodes } = require("http-status-codes");

const Favorite = require("../models/Favorite");
const Match = require("../models/Match");
const Player = require("../models/Player");
const Tournament = require("../models/Tournament");
const Country = require("../models/Country");
const User = require("../models/User");

const createFavorite = async (req, res) => {
  const { matchId, email } = req.body;
  const match = await Match.findOne({ id: matchId }).lean();
  const user = await User.findOne({ email }).lean();

  if (!match) {
    throw new NotFoundError(`Cannot find match with id ${matchId}`);
  }

  if (!user) {
    throw new NotFoundError(`Cannot find user with email ${email}`);
  }

  await Favorite.create({ matchId, userId: user._id });

  res.status(StatusCodes.OK).send();
};

const getFavoriteMatchesByUser = async (req, res) => {
  const { userId } = req.user;

  const favorites = await Favorite.find({ userId }).lean();
  let matches = await Match.find({
    id: {
      $in: favorites.map((favorite) => favorite.matchId),
    },
  }).lean();

  const players = await Player.find({
    id: {
      $in: [
        ...matches.map((match) => {
          return match.homeId;
        }),
        ...matches.map((match) => {
          return match.awayId;
        }),
      ],
    },
  }).lean();

  const countries = await Country.find({}).lean();

  const tournaments = await Tournament.find({
    id: {
      $in: matches.map((match) => match.tournamentId),
    },
  }).lean();

  matches = matches
    .map((match) => {
      const homePlayer = players.find((p) => {
        return p.id === match.homeId;
      });
      const awayPlayer = players.find((p) => {
        return p.id === match.awayId;
      });
      const favoriteId = favorites.find(
        (favorite) =>
          favorite.matchId === match.id && favorite.userId === userId
      )?._id;
      const tournament = tournaments.find(
        (tournament) => tournament.id === match.tournamentId
      );

      if (!homePlayer || !awayPlayer) {
        return undefined;
      }

      const homeCountry = countries.find(
        (c) => c.name?.toLowerCase() === homePlayer.country.toLowerCase()
      );

      const awayCountry = countries.find(
        (c) => c.name?.toLowerCase() === awayPlayer.country.toLowerCase()
      );

      return {
        ...match,
        homePlayer: { ...homePlayer, countryKey: homeCountry.key },
        awayPlayer: { ...awayPlayer, countryKey: awayCountry.key },
        tournament: { ...tournament },
        favoriteId: favoriteId,
      };
    })
    .filter((match) => Boolean(match));

  // group matches by date
  const matchesByDate = matches.reduce((acc, value) => {
    const date = new Date(value.date).toLocaleDateString("en-GB", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    });

    if (!acc[date]) {
      acc[date] = [];
    }

    acc[date].push(value);

    return acc;
  }, {});

  let result = Object.keys(matchesByDate).map((key) => {
    return {
      date: key,
      matches: matchesByDate[key],
    };
  });

  // grouped matches by tournament
  result = result.map((value) => {
    const { matches: msByDate } = value;

    const msByTournament = msByDate.reduce((acc, value) => {
      const { tournamentId } = value;

      if (!acc[tournamentId]) {
        acc[tournamentId] = [];
      }

      acc[tournamentId].push(value);

      return acc;
    }, {});

    const resultMsByTournament = Object.keys(msByTournament).map((key) => {
      return {
        tournament: msByTournament[key][0].tournament,
        matches: msByTournament[key],
      };
    });

    return { date: value.date, tournaments: resultMsByTournament };
  });

  res.status(StatusCodes.OK).json({ matchesByDate: result });
};

const deleteFavorite = async (req, res) => {
  const { favoriteId, email } = req.query;

  const user = await User.findOne({ email }).lean();
  const favorite = await Favorite.findOne({
    _id: favoriteId,
    userId: user._id,
  }).lean();

  if (!favorite) {
    throw new NotFoundError(`Cannot find favorite with id ${favoriteId}`);
  }

  await Favorite.findOneAndRemove({ _id: favoriteId });

  res.status(StatusCodes.OK).send();
};

module.exports = {
  createFavorite,
  getFavoriteMatchesByUser,
  deleteFavorite,
};
