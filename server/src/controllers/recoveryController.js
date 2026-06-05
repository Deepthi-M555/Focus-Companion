const {
  recoverSchedule
} =
require("../services/recoveryService");

module.exports.recover =
async (req, res) => {

  const recovered =
    recoverSchedule(
      req.body
    );

  res.json(recovered);

};