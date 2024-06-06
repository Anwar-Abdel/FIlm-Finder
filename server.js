require('dotenv').config();
const express = require('express');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('./config/passport-config');
const isLoggedIn = require('./middleware/isLoggedIn');
const authRouter = require('./controllers/auth');
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const { searchMovie } = require('./api_calls/movieGet');
const User = require('./models/user');
const mongoose = require('mongoose');
const Movie = require('./models/Movie');
const axios = require('axios');

const SECRET_SESSION = process.env.SECRET_SESSION;
const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.use(session({
    secret: SECRET_SESSION,
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.alerts = req.flash();
    res.locals.currentUser = req.user;
    next();
});

//----------USE ROUTERS---------//
app.use('/auth', authRouter);

//-----------GET ROUTES-------------//
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/profile', isLoggedIn, async (req, res) => {
    const user = req.user;

    if (user) {
        await user.populate('movies');
        const favoriteMovies = user.movies;

        res.render('profile', {
            user: user,
            favoriteMovies: favoriteMovies
        });
    } else {
        res.render('profile', {
            user: { name: "Guest" },
            favoriteMovies: []
        });
    }
});

app.get('/movies/search', isLoggedIn, (req, res) => {
    res.render('search2');
});

//-----------API ROUTES-------------//
app.get('/api/movies/search', isLoggedIn, async (req, res) => {
    console.log(req.query);

    let queries = req.query.query;
    if (!Array.isArray(queries)) {
        queries = [queries];
    }

    const results = [];

    for (const query of queries) {
        const response = await axios.get(`${BASE_URL}/search/movie`, {
            params: {
                api_key: API_KEY,
                query: query
            }
        });
        if (response.data.results && response.data.results.length > 0) {
            results.push(response.data.results[0]);
        }
    }

    console.log(results);

    res.render('searchMovies', { movies: results });
});

//------------POST ROUTES---------------//
app.post('/movies/add', isLoggedIn, async (req, res) => {
    const { tmdb_id, title, overview, release_date, poster_path } = req.body;
    
    try {
        let movie = await Movie.findOne({ tmdb_id: tmdb_id });
        if (!movie) {
            movie = new Movie({ tmdb_id, title, overview, release_date, poster_path });
            await movie.save();
        }

        // Add the movie to the user's favorites
        const user = await User.findById(req.user._id);
        if (!user.movies.includes(movie._id)) {
            user.movies.push(movie._id);
            await user.save();
        }

        res.redirect('/profile');
    } catch (error) {
        console.error('Failed to add movie:', error);
        res.status(500).send('Failed to add movie');
    }
});

const server = app.listen(PORT, () => {
    console.log('🏎️ You are listening on PORT', PORT);
});

module.exports = server;
