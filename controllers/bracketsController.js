const Bracket = require("../models/Bracket");
const Tournament = require("../models/Tournament");
const Round = require("../models/Round");
const Player = require("../models/Player");
const Match = require("../models/Match");
const Pick = require("../models/Pick");
const Favorite = require("../models/Favorite");
const User = require("../models/User");
const UserToken = require("../models/UserToken");
const { Expo } = require("expo-server-sdk");

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
      homePlayer: !homePlayer || homePlayer.id < 0 ? null : homePlayer,
      awayPlayer: !awayPlayer || awayPlayer.id < 0 ? null : awayPlayer,
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

  if (
    matches.some(
      (m) =>
        m.tournamentId === tournament.id &&
        m.roundId === round._id.toString() &&
        (m.homeId === homePlayer.id || m.awayId === awayPlayer.id)
    )
  ) {
    const existingMatch = matches.find(
      (m) =>
        m.tournamentId === tournament.id &&
        m.roundId === round._id.toString() &&
        (m.homeId === homePlayer.id || m.awayId === awayPlayer.id)
    );

    const match = await Match.findOneAndUpdate(
      { id: existingMatch.id },
      {
        status: "pending",
        homeId: homePlayer.id,
        awayId: awayPlayer.id,
        date,
        tournamentId: tournament.id,
        roundId: round._id,
      },
      { runValidators: true, new: true }
    );
    console.log("Match updated!");
    res.status(StatusCodes.OK).json({ bracket, match });
  } else {
    const match = await Match.create({
      id: matches.length ? matches[matches.length - 1].id + 1 : 1,
      status: "pending",
      homeId: homePlayer.id,
      awayId: awayPlayer.id,
      date,
      tournamentId: tournament.id,
      roundId: round._id,
    });
    console.log("Match created!");
    res.status(StatusCodes.OK).json({ bracket, match });
  }
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

  if (!match) {
    throw new NotFoundError("Match does not exist!");
  }

  const homePlayer = await Player.findOne({ id: bracket.homeId }).lean();
  if (!homePlayer) {
    throw new NotFoundError("Home player does not exist!");
  }

  const awayPlayer = await Player.findOne({ id: bracket.awayId }).lean();
  if (!awayPlayer) {
    throw new NotFoundError("Away player does not exist!");
  }

  // Favorites by matchId

  const favorites = await Favorite.find({ matchId: match.id }).lean();
  let users = await User.find({}).lean();
  users = users.filter((u) =>
    favorites.some((f) => f.userId === u._id.toString())
  );

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const { _id } = user;

    const userToken = await UserToken.findOne({ userId: _id }).lean();
    if (!userToken) {
      throw new NotFoundError("User token does not exist!");
    }

    // Create a new Expo SDK client
    // optionally providing an access token if you have enabled push security
    let expo = new Expo();

    // Create the messages that you want to send to clients
    let messages = [];
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(userToken.token)) {
      throw new BadRequestError("Invalid expo push token!");
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: userToken.token,
      sound: "default",
      body: `${homePlayer.name} ${homeSets} - ${awaySets} ${awayPlayer.name}`,
      data: { withSome: "data" },
    });

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    (async () => {
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (let chunk of chunks) {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      }
    })();
  }

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
