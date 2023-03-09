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
const Bracket = require("./models/Bracket");

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

const seedMatches = async (tournamentName) => {
  const tournament = await Tournament.findOne({
    name: tournamentName,
    season: 2023,
  }).lean();
  if (!tournament) {
    console.log("Tournament does not exist!");
    return;
  }

  const options = {
    method: "GET",
    url: `https://ultimate-tennis1.p.rapidapi.com/tournament_results/${tournament.ultimateTennisID}/2023`,
    headers: {
      "X-RapidAPI-Key": "b42add0993msh416609f115312fdp1ac881jsn7ffc40503465",
      "X-RapidAPI-Host": "ultimate-tennis1.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    const matches = Array.from(response.data.data);

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];

      const loser = await Player.findOne({
        ultimateTennisID: match["Loser Id"],
      }).lean();
      if (!loser) {
        console.log("Loser does not exist!");
        continue;
      }

      const winner = await Player.findOne({
        ultimateTennisID: match["Winner ID"],
      }).lean();

      if (!winner) {
        console.log("Winner does not exist!");
        continue;
      }

      let dbMatch = await Match.findOne({
        homeId: loser.id,
        awayId: winner.id,
        tournamentId: tournament.id,
      }).lean();

      if (dbMatch) {
        const firstSet = match["1st Set"];
        const secondSet = match["2nd Set"];
        const thirdSet = match["3rd Set"];

        const firstSetWinner = !isNaN(Number(firstSet[0]))
          ? Number(firstSet[0])
          : 0;
        const firstSetLoser = !isNaN(Number(firstSet[1]))
          ? Number(firstSet[1])
          : 0;

        const secondSetWinner = !isNaN(Number(secondSet[0]))
          ? Number(secondSet[0])
          : 0;
        const secondSetLoser = !isNaN(Number(secondSet[1]))
          ? Number(secondSet[1])
          : 0;

        const thirdSetWinner = !isNaN(Number(thirdSet[0]))
          ? Number(thirdSet[0])
          : 0;
        const thirdSetLoser = !isNaN(Number(thirdSet[1]))
          ? Number(thirdSet[1])
          : 0;

        let winnerSets = 0;
        let loserSets = 0;

        if (firstSetWinner > firstSetLoser) {
          winnerSets++;
        } else if (firstSetWinner < firstSetLoser) {
          loserSets++;
        }

        if (secondSetWinner > secondSetLoser) {
          winnerSets++;
        } else if (secondSetWinner < secondSetLoser) {
          loserSets++;
        }

        if (thirdSetWinner > thirdSetLoser) {
          winnerSets++;
        } else if (thirdSetWinner < thirdSetLoser) {
          loserSets++;
        }

        await Match.findOneAndUpdate(
          { id: dbMatch.id },
          {
            winnerId: winner.id,
            homeSets: loserSets.toString(),
            awaySets: winnerSets.toString(),
            homeSet1: firstSetLoser.toString(),
            homeSet2: secondSetLoser.toString(),
            homeSet3: thirdSetLoser.toString(),
            awaySet1: firstSetWinner.toString(),
            awaySet2: secondSetWinner.toString(),
            awaySet3: thirdSetWinner.toString(),
            status: "finished",
          },
          { runValidators: true }
        );
      } else {
        dbMatch = await Match.findOne({
          homeId: winner.id,
          awayId: loser.id,
          tournamentId: tournament.id,
        }).lean();

        if (!dbMatch) {
          console.log("Match does not exist!");
          continue;
        }

        const firstSet = match["1st Set"];
        const secondSet = match["2nd Set"];
        const thirdSet = match["3rd Set"];

        const firstSetWinner = !isNaN(Number(firstSet[0]))
          ? Number(firstSet[0])
          : 0;
        const firstSetLoser = !isNaN(Number(firstSet[1]))
          ? Number(firstSet[1])
          : 0;

        const secondSetWinner = !isNaN(Number(secondSet[0]))
          ? Number(secondSet[0])
          : 0;
        const secondSetLoser = !isNaN(Number(secondSet[1]))
          ? Number(secondSet[1])
          : 0;

        const thirdSetWinner = !isNaN(Number(thirdSet[0]))
          ? Number(thirdSet[0])
          : 0;
        const thirdSetLoser = !isNaN(Number(thirdSet[1]))
          ? Number(thirdSet[1])
          : 0;

        let winnerSets = 0;
        let loserSets = 0;

        if (firstSetWinner > firstSetLoser) {
          winnerSets++;
        } else if (firstSetWinner < firstSetLoser) {
          loserSets++;
        }

        if (secondSetWinner > secondSetLoser) {
          winnerSets++;
        } else if (secondSetWinner < secondSetLoser) {
          loserSets++;
        }

        if (thirdSetWinner > thirdSetLoser) {
          winnerSets++;
        } else if (thirdSetWinner < thirdSetLoser) {
          loserSets++;
        }
        // No 3rd set check
        await Match.findOneAndUpdate(
          { id: dbMatch.id },
          {
            winnerId: winner.id,
            homeSets: winnerSets.toString(),
            awaySets: loserSets.toString(),
            homeSet1: firstSetWinner.toString(),
            homeSet2: secondSetWinner.toString(),
            homeSet3: thirdSetWinner.toString(),
            awaySet1: firstSetLoser.toString(),
            awaySet2: secondSetLoser.toString(),
            awaySet3: thirdSetLoser.toString(),
            status: "finished",
          },
          { runValidators: true }
        );
      }

      let bracket = await Bracket.findOne({
        homeId: loser.id,
        awayId: winner.id,
        tournamentId: tournament.id,
      });

      if (bracket) {
        await Bracket.findOneAndUpdate(
          { _id: bracket._id },
          { winnerId: winner.id },
          { runValidators: true }
        );
      } else {
        bracket = await Bracket.findOne({
          homeId: winner.id,
          awayId: loser.id,
          tournamentId: tournament.id,
        });

        if (!bracket) {
          console.log("Bracket does not exist!");
          continue;
        }

        await Bracket.findOneAndUpdate(
          { _id: bracket._id },
          { winnerId: winner.id },
          { runValidators: true }
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const seedPlayers = async () => {
  try {
    const absolutePath = path.join(__dirname, "atp-rankings.json");
    const jsonString = await readFile(absolutePath);
    const response = JSON.parse(jsonString);

    const dbPlayers = await Player.find({}).sort("id");
    const players = Array.from(response.data);

    for (let i = 0; i < players.length; i++) {
      const player = players[i];

      await Player.create({
        id: i + 1,
        ultimateTennisID: player.id,
        name: player.Name,
        points: player.Points,
        ranking: player.Rank,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const updateTournaments = async () => {
  try {
    const absolutePath = path.join(__dirname, "tournaments.json");
    const jsonString = await readFile(absolutePath);
    const response = JSON.parse(jsonString);

    const tournaments = Array.from(response.Tournaments);

    for (let i = 0; i < tournaments.length; i++) {
      const tournament = tournaments[i];
      const { ID } = tournament;

      const dbTournament = await Tournament.findOneAndUpdate(
        { name: tournament["Tournament Name"], season: 2023 },
        {
          ultimateTennisID: Number(ID),
        },
        { runValidators: true, new: true }
      );
    }
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
    await seedMatches("Dubai Duty Free Tennis Championships");

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

    // Update tournaments
    // await updateTournaments();

    console.log("Seeding successful!");
  } catch (error) {
    console.log(error);
  }
};

start();
