const connectDB = require("./db/connect");
const axios = require("axios");
const { readFile } = require("fs").promises;
const path = require("path");
require("dotenv").config();

const Country = require("./models/Country");
const Tournament = require("./models/Tournament");
const Player = require("./models/Player");
const Match = require("./models/Match");
const User = require("./models/User");
const UserPlayer = require("./models/UserPlayer");
const UserWeek = require("./models/UserWeek");
const Week = require("./models/Week");

const express = require("express");
const app = express();

const port = process.env.PORT || 5000;

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

const seedCountries = async () => {
  const options = {
    method: "GET",
    url: "https://referential.p.rapidapi.com/v1/country?fields=currency%2Ccurrency_num_code%2Ccurrency_code%2Ccontinent_code%2Ccurrency%2Ciso_a3%2Cdial_code&limit=250",
    headers: {
      "X-RapidAPI-Key": "b42add0993msh416609f115312fdp1ac881jsn7ffc40503465",
      "X-RapidAPI-Host": "referential.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);

    const countries = Array.from(response.data);
    countries.forEach((country) => {
      const { iso_a3: code, value: name, key } = country;
      Country.create({
        name,
        key,
        code,
        countryFlag: `https://countryflagsapi.com/png/${name.toLowerCase()}`,
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const seedTournaments = async () => {
  const options = {
    method: "GET",
    url: "https://tennis-live-data.p.rapidapi.com/tournaments/ATP/2022",
    headers: {
      "X-RapidAPI-Key": "b42add0993msh416609f115312fdp1ac881jsn7ffc40503465",
      "X-RapidAPI-Host": "tennis-live-data.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);

    const tournaments = Array.from(response.data.results);
    console.log(tournaments);
    tournaments.forEach((tournament) => {
      const {
        id,
        name,
        city,
        surface,
        code,
        start_date: startDate,
        end_date: endDate,
        season,
        country_code: countryCode,
      } = tournament;

      Tournament.create({
        id,
        name,
        city,
        surface,
        code,
        startDate,
        endDate,
        season,
        countryCode,
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const getSingleMatch = async (matchId) => {
  const singleMatchOptions = {
    method: "GET",
    url: `https://tennis-live-data.p.rapidapi.com/match/${matchId}`,
    headers: {
      "X-RapidAPI-Key": "37f78d8b99mshb1330cfedd86ceap1a5633jsn41bbf1214be1",
      "X-RapidAPI-Host": "tennis-live-data.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(singleMatchOptions);
    const match = response.data.results.match;
    const tournament = response.data.results.tournament;

    const {
      id,
      status,
      home_id: homeId,
      away_id: awayId,
      date,
      court,
      round_name: round,
    } = match;

    const {
      winner_id: winnerId,
      home_sets: homeSets,
      away_sets: awaySets,
      home_set1: homeSet1,
      home_set2: homeSet2,
      home_set3: homeSet3,
      home_set4: homeSet4,
      home_set5: homeSet5,
      away_set1: awaySet1,
      away_set2: awaySet2,
      away_set3: awaySet3,
      away_set4: awaySet4,
      away_set5: awaySet5,
    } = match.result;

    Match.create({
      id,
      status,
      homeId,
      awayId,
      date: date || "n/a",
      court: court || "n/a",
      round: round || "n/a",
      winnerId: winnerId || 0,
      homeSets: homeSets || "n/a",
      awaySets: awaySets || "n/a",
      homeSet1: homeSet1 || "n/a",
      homeSet2: homeSet2 || "n/a",
      homeSet3: homeSet3 || "n/a",
      homeSet4: homeSet4 || "n/a",
      homeSet5: homeSet5 || "n/a",
      awaySet1: awaySet1 || "n/a",
      awaySet2: awaySet2 || "n/a",
      awaySet3: awaySet3 || "n/a",
      awaySet4: awaySet4 || "n/a",
      awaySet5: awaySet5 || "n/a",
      tournamentId: tournament.id,
    });
  } catch (error) {
    console.log(error);
  }
};

const seedMatches = async () => {
  const options = {
    method: "GET",
    url: "https://tennis-live-data.p.rapidapi.com/matches/1437",
    headers: {
      "X-RapidAPI-Key": "37f78d8b99mshb1330cfedd86ceap1a5633jsn41bbf1214be1",
      "X-RapidAPI-Host": "tennis-live-data.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);

    const matches = Array.from(response.data.results.matches).slice(112);
    console.log(matches);
    matches.forEach((match) => {
      getSingleMatch(match.id);
      sleep(1000);
    });
  } catch (error) {
    console.log(error);
  }
};

const seedPlayers = async () => {
  const options = {
    method: "GET",
    url: "https://tennis-live-data.p.rapidapi.com/rankings/ATP",
    headers: {
      "X-RapidAPI-Key": "b42add0993msh416609f115312fdp1ac881jsn7ffc40503465",
      "X-RapidAPI-Host": "tennis-live-data.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);

    const players = Array.from(response.data.results.rankings);
    console.log(players);
    players
      .filter((p) => p.country)
      .forEach((player) => {
        const {
          id,
          country,
          full_name: name,
          ranking_points: points,
          ranking,
        } = player;

        Player.create({
          id,
          country,
          name,
          points,
          ranking,
        });
      });
  } catch (error) {
    console.log(error);
  }
};

const updatePlayers = async () => {
  const players = await Player.find({}).sort("ranking");

  const startingPrice = 20000000;
  let multiplier = 0;

  for (let i = 0; i < players.length; i++) {
    if (players[i].ranking === 1) {
      await Player.findOneAndUpdate(
        { _id: players[i]._id },
        { price: 20000000 },
        { runValidators: true }
      );
    } else if (players[i].ranking >= 2 && players[i].ranking <= 5) {
      await Player.findOneAndUpdate(
        { _id: players[i]._id },
        { price: 15000000 },
        { runValidators: true }
      );
    } else if (players[i].ranking >= 6 && players[i].ranking <= 10) {
      await Player.findOneAndUpdate(
        { _id: players[i]._id },
        { price: 12000000 },
        { runValidators: true }
      );
    } else if (players[i].ranking >= 11 && players[i].ranking <= 20) {
      await Player.findOneAndUpdate(
        { _id: players[i]._id },
        { price: 10000000 },
        { runValidators: true }
      );
    } else if (players[i].ranking >= 21 && players[i].ranking <= 50) {
      await Player.findOneAndUpdate(
        { _id: players[i]._id },
        { price: 5000000 },
        { runValidators: true }
      );
    } else if (players[i].ranking >= 51 && players[i].ranking <= 100) {
      await Player.findOneAndUpdate(
        { _id: players[i]._id },
        { price: 2000000 },
        { runValidators: true }
      );
    } else {
      await Player.findOneAndUpdate(
        { _id: players[i]._id },
        { price: 1000000 },
        { runValidators: true }
      );
    }
  }
};

const updateUserPlayers = async () => {
  await UserPlayer.updateMany({}, { $set: { pointsWon: 0 } });
  await UserWeek.updateMany({}, { $set: { points: 0 } });
};

const updateUsers = async () => {
  await User.updateMany({}, { $set: { predictionPoints: 100, trades: 60 } });
};

const updateWeeks = async () => {
  const weeks = await Week.find({});

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    await Week.findOneAndUpdate(
      { _id: week._id },
      { from: week.from + "T00:00:00", to: week.to + "T23:59:59" },
      { runValidators: true }
    );
  }
};

const addImagesToPlayers = async () => {
  const dbPlayers = await Player.find({}).sort("ranking");
  const absolutePath = path.join(__dirname, "ranking.json");
  const jsonString = await readFile(absolutePath);
  const jsonObject = JSON.parse(jsonString);

  for (let i = 0; i < dbPlayers.length; i++) {
    if (i >= 100) {
      break;
    }

    // const singlePlayerOptions = {
    //   method: "GET",
    //   url: "https://flashlive-sports.p.rapidapi.com/v1/players/data",
    //   params: {
    //     sport_id: "2",
    //     locale: "en_INT",
    //     player_id: jsonObject.DATA[i].PARTICIPANT_ID,
    //   },
    //   headers: {
    //     "X-RapidAPI-Key": "37f78d8b99mshb1330cfedd86ceap1a5633jsn41bbf1214be1",
    //     "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
    //   },
    // };

    // const singlePlayerResponse = await axios.request(singlePlayerOptions);
    // const imageUrl = singlePlayerResponse.data.DATA.IMAGE_PATH;

    await Player.findOneAndUpdate(
      { _id: dbPlayers[i]._id },
      { gender: "male" },
      { runValidators: true }
    );

    sleep(250);
  }
};

const updateRanking = async () => {
  const dbPlayers = Array.from(await Player.find({})).sort((a, b) => {
    if (a.points > b.points) {
      return -1;
    } else if (a.points < b.points) {
      return 1;
    } else {
      const lastNameFirst = a.name.split(" ")[1];
      const lastNameSecond = b.name.split(" ")[1];

      if (lastNameFirst > lastNameSecond) {
        return 1;
      } else {
        return -1;
      }
    }
  });

  for (let i = 0; i < dbPlayers.length; i++) {
    // const singlePlayerOptions = {
    //   method: "GET",
    //   url: "https://flashlive-sports.p.rapidapi.com/v1/players/data",
    //   params: {
    //     sport_id: "2",
    //     locale: "en_INT",
    //     player_id: jsonObject.DATA[i].PARTICIPANT_ID,
    //   },
    //   headers: {
    //     "X-RapidAPI-Key": "37f78d8b99mshb1330cfedd86ceap1a5633jsn41bbf1214be1",
    //     "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
    //   },
    // };

    // const singlePlayerResponse = await axios.request(singlePlayerOptions);
    // const imageUrl = singlePlayerResponse.data.DATA.IMAGE_PATH;

    await Player.findOneAndUpdate(
      { _id: dbPlayers[i]._id },
      { ranking: i + 1 },
      { runValidators: true }
    );

    //sleep(250);
  }
};

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    app.listen(port, () => {
      console.log("CONNECTED TO THE DB...");
      console.log(`Server is listening on port ${port}...`);
    });

    // Seed countries
    // await seedCountries();

    // Seed tournaments
    // await seedTournaments();

    // Seed players
    // await seedPlayers();

    // Seed matches
    // await seedMatches();

    // Update players
    // await updatePlayers();

    // Add images to players
    // await addImagesToPlayers();

    // Update ranking
    // await updateRanking();

    // Update users
    // await updateUsers();

    // Update user players
    // await updateUserPlayers();

    // Update weeks
    // await updateWeeks();

    console.log("Seeding successful!");
  } catch (error) {
    console.log(error);
  }
};

start();
