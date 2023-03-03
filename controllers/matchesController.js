const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors/index");

const Match = require("../models/Match");
const Player = require("../models/Player");
const Favorite = require("../models/Favorite");
const Tournament = require("../models/Tournament");
const Round = require("../models/Round");
const Country = require("../models/Country");
const User = require("../models/User");

const getMatchesByTournamentIdAndDate = async (req, res) => {
  const { tournamentId, date, email } = req.query;

  if (!tournamentId || !date) {
    throw new BadRequestError("Provide tournament and date");
  }

  const tournament = await Tournament.find({ id: tournamentId }).lean();
  const user = await User.findOne({ email }).lean();

  if (!tournament) {
    throw new NotFoundError(`No tournament with id ${tournamentId}`);
  }

  if (!user) {
    throw new NotFoundError(`Not tournament with email ${email}`);
  }

  let matches = await Match.find({ tournamentId }).lean();
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
  const favorites = await Favorite.find({ userId: user._id }).lean();

  matches = matches
    .filter((match) => {
      const matchDate = new Date(match.date).toLocaleDateString("en-CA");
      const parsedDate = new Date(date).toLocaleDateString("en-CA");
      return matchDate === parsedDate;
    })
    .map((match) => {
      const homePlayer = players.find((p) => {
        return p.id === match.homeId;
      });
      const awayPlayer = players.find((p) => {
        return p.id === match.awayId;
      });
      const favoriteId = favorites.find((favorite) => {
        return (
          favorite.matchId === match.id &&
          favorite.userId === user._id.toString()
        );
      })?._id;

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
        favoriteId,
      };
    })
    .filter((match) => Boolean(match));

  res.status(StatusCodes.OK).json({ matches });
};

const getSingleMatch = async (req, res) => {
  const { id } = req.params;

  const match = await Match.findOne({ id: Number(id) }).lean();

  if (!match) {
    throw new NotFoundError(`No match found with id: ${id}`);
  }

  const round = await Round.findOne({ _id: match.roundId }).lean();

  res.status(StatusCodes.OK).json({
    match: {
      ...match,
      round: round?.name ?? "n/a",
    },
  });
};

const getSingleMatchManual = async (req, res) => {
  const { id } = req.params;
  const match = await Match.findOne({ id: Number(id) }).lean();

  if (!match) {
    throw new NotFoundError(`No match found with id: ${id}`);
  }

  const homePlayer = await Player.findOne({ id: match.homeId }).lean();

  if (!homePlayer) {
    throw new NotFoundError("Home player does not exist!");
  }

  const awayPlayer = await Player.findOne({ id: match.awayId }).lean();

  if (!awayPlayer) {
    throw new NotFoundError("Away player does not exist!");
  }

  const winnerPlayer = await Player.findOne({ id: match.winnerId }).lean();

  const round = await Round.findOne({ _id: match.roundId }).lean();

  if (!round) {
    throw new NotFoundError("Round does not exist!");
  }

  const tournament = await Tournament.findOne({
    id: match.tournamentId,
  }).lean();

  res.status(StatusCodes.OK).json({
    ...match,
    homePlayer,
    awayPlayer,
    winnerPlayer,
    round,
    tournament,
  });
};

const getMatchesByTournamentIdAndRoundId = async (req, res) => {
  const { tournamentId, roundId } = req.query;

  const players = await Player.find({}).lean();
  let matches = await Match.find({ tournamentId, roundId }).lean();
  matches = matches.map((match) => {
    const homePlayer = players.find((player) => player.id === match.homeId);
    const awayPlayer = players.find((player) => player.id === match.awayId);

    return {
      ...match,
      homePlayer: { ...homePlayer },
      awayPlayer: { ...awayPlayer },
    };
  });
  res.status(StatusCodes.OK).json({ matches });
};

const getMatchesByTournamentIdGroupedByRoundId = async (req, res) => {
  const { tournamentId } = req.query;

  let matches = await Match.find({ tournamentId }).lean();
  let rounds = await Round.find({}).lean();
  let players = await Player.find({}).lean();

  matches = matches.map((match) => {
    const homePlayer = players.find((player) => player.id === match.homeId);
    const awayPlayer = players.find((player) => player.id === match.awayId);

    return {
      ...match,
      homePlayer: { ...homePlayer },
      awayPlayer: { ...awayPlayer },
    };
  });

  const matchesByRound = matches.reduce((acc, value) => {
    if (!acc[value.roundId]) {
      acc[value.roundId] = [];
    }

    acc[value.roundId].push(value);
    return acc;
  }, {});

  matches = Object.keys(matchesByRound).map((key) => {
    const round = rounds.find((round) => round._id.equals(key));
    return {
      round,
      matches: matchesByRound[key],
    };
  });

  res.status(StatusCodes.OK).json({ groupedMatches: matches });
};

const getMatchesByPlayerGroupedByTournamentId = async (req, res) => {
  const { playerId } = req.query;

  const players = await Player.find({}).lean();
  const tournaments = await Tournament.find({}).lean();
  const countries = await Country.find({}).lean();

  let matches = await Match.find({
    $or: [
      { homeId: { $eq: playerId } },
      {
        awayId: { $eq: playerId },
      },
    ],
  }).lean();

  let result = matches
    .map((match) => {
      const homePlayer = players.find((player) => player.id === match.homeId);
      const awayPlayer = players.find((player) => player.id === match.awayId);

      if (!homePlayer || !awayPlayer) return undefined;

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
      };
    })
    .filter((match) => Boolean(match));

  const groupedMatches = result.reduce((acc, value) => {
    if (!acc[value.tournamentId]) {
      acc[value.tournamentId] = [];
    }

    acc[value.tournamentId].push(value);

    return acc;
  }, {});

  result = Object.keys(groupedMatches).map((key) => {
    const tournament = tournaments.find(
      (tournament) => tournament.id === Number(key)
    );

    return {
      tournament,
      matches: groupedMatches[key],
    };
  });

  res.status(StatusCodes.OK).json({ groupedMatches: result });
};

const getLastMatchesByPlayer = async (req, res) => {
  const { skipMatchId, playerId, surface, email } = req.body;
  const user = await User.findOne({ email }).lean();

  if (!user) {
    throw new NotFoundError("User not found!");
  }

  let matches = await Match.find({
    $or: [{ homeId: { $eq: playerId } }, { awayId: { $eq: playerId } }],
    id: {
      $not: { $eq: skipMatchId },
    },
  }).lean();

  const matchIds = matches.map((match) => match.id);

  const players = await Player.find({}).lean();
  const countries = await Country.find({}).lean();
  const favorites = await Favorite.find({
    $in: matchIds,
  }).lean();
  const tournaments = await Tournament.find({
    $in: matchIds,
  }).lean();

  const player = players.find((player) => player.id === Number(playerId));
  if (surface.toLowerCase() !== "all") {
    matches = matches.filter((match) => {
      const tournament = tournaments.find(
        (tournament) => tournament.id === match.tournamentId
      );

      if (tournament.surface.toLowerCase() === surface.toLowerCase()) {
        return true;
      }
    });
  }

  matches = matches
    .map((match) => {
      const homePlayer = players.find((player) => player.id === match.homeId);
      const awayPlayer = players.find((player) => player.id === match.awayId);

      const favoriteId = favorites.find(
        (favorite) =>
          favorite.matchId === match.id &&
          favorite.userId === user._id.toString()
      )?._id;

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
        favoriteId,
      };
    })
    .filter((match) => match);

  console.log(matches);
  res.status(StatusCodes.OK).json({ player, matches });
};

const getLastHedToHeadMatches = async (req, res) => {
  const { skipMatchId, homeId, awayId, surface, email } = req.body;
  const user = await User.findOne({ email }).lean();

  if (!user) {
    throw new NotFoundError("User not found!");
  }

  const favorites = await Favorite.find({}).lean();
  const tournaments = await Tournament.find({}).lean();

  const matches = await Match.find({
    $or: [
      {
        homeId: homeId,
        awayId: awayId,
      },
      {
        homeId: awayId,
        awayId: homeId,
      },
    ],
    id: {
      $not: { $eq: skipMatchId },
    },
  }).lean();

  const homePlayer = await Player.findOne({ id: homeId }).lean();
  const awayPlayer = await Player.findOne({ id: awayId }).lean();

  // filter matches by surface

  if (surface.toLowerCase() !== "all") {
    matches = matches.filter((match) => {
      const tournament = tournaments.find(
        (tournament) => tournament.id === match.tournamentId
      );

      if (tournament.surface.toLowerCase() === surface.toLowerCase()) {
        return true;
      }
    });
  }

  matches = matches.map((match) => {
    const favoriteId = favorites.find(
      (favorite) =>
        favorite.matchId === match.id && favorite.userId === user._id.toString()
    )?._id;

    return {
      ...match,
      homePlayer,
      awayPlayer,
      favoriteId,
    };
  });

  res.status(StatusCodes).json({ matches });
};

const createMatch = async (req, res) => {
  const { homeId, awayId, winnerId } = req.body;

  const homePlayer = await Player.findOne({ id: homeId }).lean();
  if (!homePlayer) {
    throw new BadRequestError("Player does not exist!");
  }

  const awayPlayer = await Player.findOne({ id: awayId }).lean();
  if (!awayPlayer) {
    throw new BadRequestError("Player does not exist!");
  }

  if (homeId === awayId) {
    throw new BadRequestError("You cannot select same players!");
  }

  if (winnerId && winnerId !== homeId && winnerId !== awayId) {
    throw new BadRequestError("Winner should be from the selected players!");
  }

  const matches = await Match.find({}).sort("id");

  const match = await Match.create({
    ...req.body,
    id: matches[matches.length - 1].id + 1,
    round: "n/a",
  });
  res.status(StatusCodes.CREATED).json({ match });
};

const updateMatch = async (req, res) => {
  const { id } = req.params;
  const { homeId, awayId, winnerId } = req.body;

  const match = await Match.findOne({ id: Number(id) }).lean();
  if (!match) {
    throw new NotFoundError("Match does not exist!");
  }

  const homePlayer = await Player.findOne({ id: homeId }).lean();
  if (!homePlayer) {
    throw new NotFoundError("Player does not exist!");
  }

  const awayPlayer = await Player.findOne({ id: awayId }).lean();
  if (!awayPlayer) {
    throw new NotFoundError("Player does not exist!");
  }

  if (homeId === awayId) {
    throw new BadRequestError("You cannot select same players!");
  }

  if (winnerId) {
    if (winnerId !== homeId && winnerId !== awayId) {
      throw new BadRequestError("Winner should be from the selected players!");
    }
  }

  const newMatch = await Match.findOneAndUpdate(
    { id: Number(id) },
    { ...req.body },
    { runValidators: true, new: true }
  );

  res.status(StatusCodes.OK).json({ match: newMatch });
};

module.exports = {
  getMatchesByTournamentIdAndDate,
  getSingleMatch,
  getSingleMatchManual,
  getMatchesByTournamentIdAndRoundId,
  getMatchesByTournamentIdGroupedByRoundId,
  getMatchesByPlayerGroupedByTournamentId,
  getLastMatchesByPlayer,
  getLastHedToHeadMatches,
  createMatch,
  updateMatch,
};
