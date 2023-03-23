const UserToken = require("../models/UserToken");
const User = require("../models/User");
const { NotFoundError } = require("../errors/index");
const { StatusCodes } = require("http-status-codes");

const subscribeForPushNotifications = async (req, res) => {
  const { email, token } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const existingUserToken = await UserToken.findOne({
    userId: user._id,
  }).lean();
  if (!existingUserToken) {
    const userToken = await UserToken.create({ userId: user._id, token });
    res.status(StatusCodes.CREATED).json({ userToken });
  } else {
    const updatedUserToken = await UserToken.findOneAndUpdate(
      { _id: existingUserToken._id },
      { token },
      { runValidators: true, new: true }
    );
    res.status(StatusCodes.OK).json({ updatedUserToken });
  }
};

module.exports = {
  subscribeForPushNotifications,
};
