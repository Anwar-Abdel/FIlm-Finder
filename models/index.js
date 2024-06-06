// import models
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

db.once('open', () => console.log(`Connected to MongoDB at ${db.host}:${db.port}`));
db.on('error', (error) => console.log('Database error \n', error));

const User = require('./user');

module.exports = {
    // models go
    User,
}