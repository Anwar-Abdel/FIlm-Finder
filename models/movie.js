const mongoose = require('mongoose');

// Movie Schema
const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    overview: { type: String, required: true },
    release_date: { type: Date, required: true },
    genres: [{ type: String, required: true }],
    poster_path: { type: String, required: true },
    tmdb_id: { type: String, required: true },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, required: true },
        created_at: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
