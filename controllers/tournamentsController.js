const { StatusCodes } = require("http-status-codes");
const Country = require("../models/Country");
const Tournament = require("../models/Tournament");
const Match = require("../models/Match");
const Favorite = require("../models/Favorite");
const { BadRequestError } = require("../errors");
const User = require("../models/User");

const getTournaments = async (req, res) => {
  let tournaments = await Tournament.find({}).sort({ city: "asc" }).lean();
  const countries = await Country.find({}).lean();
  tournaments = tournaments
    .filter((t) => t.season === 2023)
    .map((t) => {
      const country = countries.find((c) => {
        return c.code.toLowerCase() === t.countryCode.toLowerCase();
      });

      if (country) {
        return {
          id: t.id,
          city: t.city,
          code: t.code,
          startDate: t.startDate,
          endDate: t.endDate,
          countryName: country.name,
          season: t.season,
          name: t.name,
        };
      }

      return t;
    });

  res.status(StatusCodes.OK).json({ tournaments });
};

const getTournamentsByDate = async (req, res) => {
  const { date, email } = req.query;

  const tokens = date.split("/");

  const month = tokens[0];
  const day = tokens[1];
  const year = "20" + tokens[2];

  // const { userId } = req.user;
  let tournaments = await Tournament.find({}).sort({ city: "asc" }).lean();
  const countries = await Country.find({}).lean();
  const matches = await Match.find({}).lean();
  const user = await User.findOne({ email }).lean();
  const favorites = await Favorite.find({ userId: user?._id }).lean();

  tournaments = tournaments
    .filter((t) => {
      const startDate = new Date(t.startDate);
      const endDate = new Date(t.endDate);
      const parsedDate = new Date(`${year}-${month}-${day}`);

      return parsedDate >= startDate && parsedDate <= endDate;
    })
    .map((t) => {
      const country = countries.find((c) => {
        return c.code.toLowerCase() === t.countryCode.toLowerCase();
      });

      let favoritesCount = 0;

      const matchesCount = matches
        .filter((m) => {
          const parsedDate = new Date(date).toLocaleDateString("en-CA");
          const matchDate = new Date(m.date).toLocaleDateString("en-CA");
          return (
            parsedDate === matchDate &&
            t.id === m.tournamentId &&
            m.homeId > 0 &&
            m.awayId > 0
          );
        })
        .map((match) => {
          if (
            favorites.some(
              (favorite) =>
                favorite.matchId === match.id && favorite.userId === user._id
            )
          ) {
            favoritesCount++;
          }

          return match;
        }).length;

      if (country) {
        return {
          id: t.id,
          name: t.name,
          city: t.city,
          code: t.code,
          startDate: t.startDate,
          endDate: t.endDate,
          countryName: country.name,
          countryCode: country.code,
          countryKey: country.key,
          matchesCount: matchesCount,
          favoritesCount,
        };
      }

      return t;
    });
  res.status(StatusCodes.OK).json({ tournaments });
};

const getTournamentsByWeek = async (req, res) => {
  const { weekId } = req.query;

  let tournaments = await Tournament.find({ weekId }).lean();

  const countries = await Country.find({}).lean();
  tournaments = tournaments.map((t) => {
    const country = countries.find((c) => {
      return c.code.toLowerCase() === t.countryCode.toLowerCase();
    });

    if (country) {
      return {
        id: t.id,
        name: t.name,
        city: t.city,
        code: t.code,
        startDate: t.startDate,
        endDate: t.endDate,
        countryName: country.name,
        countryKey: country.key,
      };
    }

    return t;
  });

  res.status(StatusCodes.OK).json({ tournaments });
};

const getSingleTournament = async (req, res) => {
  const { id } = req.params;
  const tournament = await Tournament.findOne({ id: Number(id) }).lean();
  if (!tournament) {
    throw new BadRequestError("No tournament found");
  }

  const countries = await Country.find({}).lean();

  const country = countries.find(
    (c) => c.code?.toLowerCase() === tournament.countryCode.toLowerCase()
  );
  res.status(StatusCodes.OK).json({
    tournament: {
      ...tournament,
      countryName: country.name,
      countryKey: country.key,
    },
  });
};

const createTournament = async (req, res) => {
  const tournaments = await Tournament.find({}).sort("id").lean();
  const tournament = await Tournament.create({
    ...req.body,
    id: tournaments[tournaments.length - 1].id + 1,
  });
  res.status(StatusCodes.CREATED).json({ tournament });
};

module.exports = {
  getTournaments,
  getTournamentsByDate,
  getTournamentsByWeek,
  getSingleTournament,
  createTournament,
};
