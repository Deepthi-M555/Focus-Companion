const User = require("../models/User");

module.exports.getCurrentUser = async (req, res) => {
  const user = await User.findById(req.identity.userId).select("name email");

  res.json({
    name: user.name,
    email: user.email,
    avatar: ""
  });
};
