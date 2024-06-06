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
    console.log(req.query)
    const response = await axios.get('https://api.themoviedb.org/3/discover/movie',{ params: {
        api_key: process.env.API_KEY,
        query: req.query.query
    }})
    console.log(response.data.results[0].title);

    res.render('searchMovies', {data:response.data.results[0]})

    // axios.get(`${BASE_URL}/search/movie`, {
    //     params: {
    //         api_key: API_KEY,
    //         query: query
    //     }
    // });

    // const query = req.query.query;
    // const movies = await searchMovie(query);

    // if (movies.length > 0) {
    //     console.log(movies);
    //     res.json(movies[0]);
    // } else {
    //     res.status(404).json({ error: 'Movie not found' });
    // }
});

//------------POST ROUTES---------------//
app.post('/movies/add', isLoggedIn, async (req, res) => {
    const { movieId } = req.body;
    console.log(req.body)
    // try {
    //     const user = await User.findById(req.user._id);
    //     const movie = await Movie.findById(movieId);

    //     if (movie) {
    //         user.movies.addToSet(movie._id);
    //         await user.save();
    //         res.status(200).send('Movie added to favorites');
    //     } else {
    //         res.status(404).send('Movie not found');
    //     }
    // } catch (error) {
    //     console.error('Failed to add movie:', error);
    //     res.status(500).send('Failed to add movie');
    // }
});

const server = app.listen(PORT, () => {
    console.log('🏎️ You are listening on PORT', PORT);
});

module.exports = server;
