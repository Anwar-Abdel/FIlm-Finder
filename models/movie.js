const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Movie Schema
const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    overview: { type: String, required: true },
    release_date: { type: Date, required: true },
    genres: [{ type: String, required: true }],
    poster_path: { type: String, required: true },
    tmdb_id: { type: String, required: true },
}, { timestamps: true });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
