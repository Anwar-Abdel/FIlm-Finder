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
const Movie = require('./models/movie');
const Review = require('./models/review');
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

        let movie = await Movie.findOne({ tmdb_id: tmdbId }).populate('reviews');

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

app.get('/movies/:tmdb_id/review/:review_id', isLoggedIn, async (req, res) => {
    try {
        const { tmdb_id, review_id } = req.params;

        const movie = await Movie.findOne({ tmdb_id }).populate('reviews');
        if (!movie) {
            return res.status(404).send('Movie not found');
        }

        const review = movie.reviews.find(review => review._id.toString() === review_id);
        if (!review) {
            return res.status(404).send('Review not found');
        }

        res.render('review', { movie, review });
    } catch (err) {
        console.error('Error fetching review:', err);
        res.status(500).send('Error fetching review');
    }
});



//-----------POST ROUTES-------------//
app.post('/movies/:tmdb_id/review', isLoggedIn, async (req, res) => {
    try {
        const tmdbId = req.params.tmdb_id;
        const reviewContent = req.body.review;

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

        
        const newReview = new Review({
            user: req.user._id,
            content: reviewContent,
            movie: movie._id 
        });

        await newReview.save();

        
        movie.reviews.push(newReview._id);
        await movie.save();

        res.redirect(`/movies/${tmdbId}/review/${newReview._id}`);
    } catch (err) {
        console.error('Error submitting review:', err);
        res.status(500).send('Error submitting review');
    }
});

app.post('/movies/:tmdb_id/favorite', isLoggedIn, async (req, res) => {
    try {
        const tmdbId = req.params.tmdb_id;
        const user = req.user;

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

        user.movies.push(movie._id);
        await user.save();
        res.redirect('/profile');

    } catch (err) {
        console.error('Error adding movie to favorites:', err);
        req.flash('error', 'Error adding movie to favorites');
        res.redirect('/profile');
    }
});

//-----------PUT ROUTES-------------//
app.put('/movies/:tmdb_id/review/:review_id', isLoggedIn, async (req, res) => {
    try {
        const { tmdb_id, review_id } = req.params;
        const { review } = req.body;

        const movie = await Movie.findOneAndUpdate(
            { tmdb_id, "reviews._id": review_id },
            { "$set": { "reviews.$.content": review } },
            { new: true }
        );

        res.redirect(`/movies/${tmdb_id}/review/${review_id}`);
    } catch (err) {
        console.error('Error updating review:', err);
        res.status(500).send('Error updating review');
    }
});

//------------DELETE ROUTES---------------//
app.delete('/movies/:tmdb_id/review/:review_id', isLoggedIn, async (req, res) => {
    try {
        const { tmdb_id, review_id } = req.params;
        await Review.findOneAndDelete({ _id: review_id, user: req.user._id });

        res.redirect(`/movies/${tmdb_id}`);
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).send('Error deleting review');
    }
});


app.delete('/movies/:id', isLoggedIn, async (req, res) => {
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

//----------404 HANDLING-----------//
app.use((req, res, next) => {
    res.status(404).render('404');
});

const server = app.listen(PORT, () => {
    console.log('🏎️ You are listening on PORT', PORT);
});

module.exports = server;
