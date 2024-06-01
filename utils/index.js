const bcrypt = require('bcryptjs');

function validPassword(typedPassword, userPassword) {
    let isCorrectPassword = bcrypt.compareSync(typedPassword, userPassword);

    return isCorrectPassword; // true or false
}

module.exports = {
    validPassword,
    // any other methods needed with go here
}