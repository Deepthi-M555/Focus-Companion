const requiredEnvVars = [

  "MONGO_URI",

  "JWT_SECRET",

  "GEMINI_API_KEY"

];

const validateEnv = () => {

  const missingVars =
    requiredEnvVars.filter(
      envVar =>
        !process.env[envVar]
    );

  if (missingVars.length > 0) {

    console.error(
      "Missing ENV Variables:",
      missingVars
    );

    process.exit(1);

  }

};

module.exports = validateEnv;
