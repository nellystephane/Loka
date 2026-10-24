const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI manquant. Configurez MongoDB Atlas avant de démarrer l’API.');
  }

  mongoose.set('strictQuery', false);

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'loka',
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 2),
    retryWrites: true
  });

  console.log(`✅ MongoDB connecté — base: ${mongoose.connection.name}`);
  return mongoose.connection;
};

module.exports = connectDB;
