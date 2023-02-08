const createTokenUser = (user) => {
  return {
    name: user.firstName + " " + user.lastName,
    userId: user._id,
    role: user.role,
  };
};

module.exports = createTokenUser;
