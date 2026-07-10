const requiredEnvVars=[
"MONGO_URI",
"JWT_SECRET",
"OPENROUTER_API_KEY",
"OPENROUTER_MODEL",
"VOICE_SERVICE_URL"
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
