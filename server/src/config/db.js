const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Database Connection Error:', error.message);

        process.exit(1);
    }
};

module.exports = connectDB;

// WHAT IS HAPPENING HERE?
// mongoose.connect()

// Creates connection between:

// Node.js server ↔ MongoDB

// Without this:
// backend cannot access database.

// WHY async/await?

// Database connection takes time.

// Node.js must WAIT before continuing.

// Otherwise:
// server may start before DB ready.

// BAD.

// WHY process.exit(1)?

// If DB fails:

// app should crash immediately.

// Why?

// Because:
// half-working backend is dangerous.

// Real servers fail FAST.