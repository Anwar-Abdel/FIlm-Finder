const mongoose = require('mongoose');
require('dotenv').config();
// import models
const { User } = require('../models');

// Create a User
User.create({
    name: 'Kevin Jones',
    email: 'kevinjones@email.com',
    phone: '888-444-1010',
    password: 'poiuytrewq'
})
.then(user => {
    console.log('---- NEW USER ----\n', user);
})
.catch(error => {
    console.log('---- ERROR CREATING USER ----\n', error);
})