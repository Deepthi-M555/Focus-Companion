class ExpressError extends Error {
  constructor(statusCode, message) {
    super(message);   // IMPORTANT
    this.statusCode = statusCode;
  }
}

module.exports = ExpressError;