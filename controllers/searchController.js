const { BadRequestError } = require("../errors");
const Tournament = require("../models/Tournament");
const Player = require("../models/Player");
const Country = require("../models/Country");
const { StatusCodes } = require("http-status-codes");

const searchByString = async (req, res) => {
  const { searchString, option } = req.query;

  let tournamentSearchResults = [];
  let playerSearchResults = [];

  const currYear = new Date().getFullYear();
  switch (option.toLowerCase()) {
    case "all":
      tournamentSearchResults = await Tournament.find({
        name: {
          $regex: searchString,
          $options: "i",
        },
        startDate: {
          $regex: currYear,
          $options: "i",
        },
        endDate: {
          $regex: currYear,
          $options: "i",
        },
      })
        .limit(10)
        .lean();

      playerSearchResults = await Player.find({
        name: {
          $regex: searchString,
          $options: "i",
        },
      })
        .limit(10)
        .lean();

      break;
    case "tournaments":
      tournamentSearchResults = await Tournament.find({
        name: {
          $regex: searchString,
          $options: "i",
        },
        startDate: {
          $regex: currYear,
          $options: "i",
        },
        endDate: {
          $regex: currYear,
          $options: "i",
        },
      })
        .limit(10)
        .lean();

      break;
    case "players":
      playerSearchResults = await Player.find({
        name: {
          $regex: searchString,
          $options: "i",
        },
      })
        .limit(10)
        .lean();

      break;
    default:
      throw new BadRequestError(`Option ${option} does not exist!`);
  }

  const countries = await Country.find({}).lean();

  tournamentSearchResults = tournamentSearchResults.map((tournament) => {
    const country = countries.find(
      (country) =>
        country.code.toLowerCase() === tournament.countryCode.toLowerCase()
    );

    return {
      id: tournament.id,
      name: tournament.name,
      countryKey: country?.key,
    };
  });

  playerSearchResults = playerSearchResults.map((player) => {
    const country = countries.find(
      (country) => country.name.toLowerCase() === player.country.toLowerCase()
    );

    return {
      id: player.id,
      name: player.name,
      countryKey: country?.key,
      imageUrl: player.imageUrl,
    };
  });

  res
    .status(StatusCodes.OK)
    .json({ tournamentSearchResults, playerSearchResults });
};

module.exports = {
  searchByString,
};

//  search by one method and retrieve by {name and id} and try to guess if its player or tournament
// search by tournament method and search by player method and then retrieve search results and then display
