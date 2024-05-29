require('dotenv').config();
const express = require('express');
const app = express();
const flash = require('connect-flash');
const session = require('express-session');
// const passport = require('./config/passport-config');
// const isLoggedIn = require('./middleware/isLoggedIn');

const SECRET_SESSION = process.env.SECRET_SESSION;