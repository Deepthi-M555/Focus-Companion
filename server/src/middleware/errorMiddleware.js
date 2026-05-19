module.exports = (
  err,
  req,
  res,
  next
) => {

  const statusCode =
    err.statusCode || 500;

  const message =
    err.message ||
    "Internal Server Error";

  /*
    Development Logging
  */
  console.error("ERROR:");
  console.error(err);

  /*
    Production Safe Response
  */
  res.status(statusCode).json({

    success: false,

    error: {
      message,

      /*
        Show stack only in dev
      */
      stack:
        process.env.NODE_ENV ===
        "development"
          ? err.stack
          : undefined
    }

  });

};
/*WHY THIS IS IMPORTANT

Notice:

stack only in development

In production:
NEVER expose:

internal file paths
stack traces
implementation details

This is:

secure production design.
*/