require('dotenv').config();
const express = require('express');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('./config/passport-config');
const methodOverride = require('method-override');
const axios = require('axios');
const isLoggedIn = require('./middleware/isLoggedIn');
const authRouter = require('./controllers/auth');
const { searchMovie } = require('./api_calls/movieGet');
const User = require('./models/user');
const Movie = require('./models/Movie');
const API_KEY = process.env.API_KEY;
const SECRET_SESSION = process.env.SECRET_SESSION;
const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://api.themoviedb.org/3';

const app = express();

app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
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
        res.redirect('/auth/login');
    }
});

app.get('/movies/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.render('searchMovies', { movies: [] });
        }

        // Assuming you have a function to search for movies
        const movies = await searchMovie(query);
        res.render('searchMovies', { movies });
    } catch (err) {
        console.error('Error searching movies:', err);
        res.status(500).send('Error searching movies');
    }
});

app.get('/movies/:tmdb_id', async (req, res) => {
    try {
        const tmdbId = req.params.tmdb_id;

        let movie = await Movie.findOne({ tmdb_id: tmdbId });

        if (!movie) {
            const response = await axios.get(`${BASE_URL}/movie/${tmdbId}`, {
                params: { api_key: API_KEY }
            });

            const movieData = response.data;
            movie = new Movie({
                title: movieData.title,
                overview: movieData.overview,
                release_date: movieData.release_date,
                genres: movieData.genres.map(genre => genre.name),
                poster_path: movieData.poster_path,
                tmdb_id: tmdbId
            });

            await movie.save();
        }

        res.render('movieInfo', { movie });
    } catch (err) {
        console.error('Error fetching movie details:', err);
        res.status(500).send('Error fetching movie details');
    }
});

//-----------POST ROUTES-------------//
app.post('/movies/:id/review', isLoggedIn, async (req, res) => {
    try {
        const movieId = req.params.id;
        const review = req.body.review;

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).send('Invalid movie ID');
        }

        const movie = await Movie.findById(movieId);
        movie.review = review;
        await movie.save();

        res.redirect(`/movies/${movie._id}`);
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).send('Error adding review');
    }
});

app.post('/movies/:tmdb_id/favorite', isLoggedIn, async (req, res) => {
    try {
        const tmdbId = req.params.tmdb_id;
        const user = req.user;

        // Find or create the movie in the database
        let movie = await Movie.findOne({ tmdb_id: tmdbId });
        if (!movie) {
            const response = await axios.get(`${BASE_URL}/movie/${tmdbId}`, {
                params: { api_key: API_KEY }
            });

            const movieData = response.data;
            movie = new Movie({
                title: movieData.title,
                overview: movieData.overview,
                release_date: movieData.release_date,
                genres: movieData.genres.map(genre => genre.name),
                poster_path: movieData.poster_path,
                tmdb_id: tmdbId
            });

            await movie.save();
        }

        // Add the movie to the user's favorites
        user.movies.push(movie._id);
        await user.save();
        res.redirect('/profile');
        
    } catch (err) {
        console.error('Error adding movie to favorites:', err);
        req.flash('error', 'Error adding movie to favorites');
        res.redirect('/profile');
    }
});

//------------DELETE ROUTES---------------//
// DELETE route to delete a review
app.delete('/movies/:id/review', async (req, res) => {
    try {
        const movieId = req.params.id;

        const movie = await Movie.findById(movieId);
        movie.review = null;
        await movie.save();

        res.redirect(`/movies/${movie._id}`);
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).send('Error deleting review');
    }
});

// DELETE route to remove a favorite movie
app.delete('/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id;

        const user = await User.findById(req.user._id);
        user.movies = user.movies.filter(movieId => movieId.toString() !== req.params.id);
        await user.save();
        await Movie.findByIdAndDelete(movieId);

        res.redirect('/profile');
    } catch (err) {
        console.error('Error deleting movie:', err);
        res.status(500).send('Error deleting movie');
    }
});


const server = app.listen(PORT, () => {
    console.log('🏎️ You are listening on PORT', PORT);
});

module.exports = server;
