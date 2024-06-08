# Film Finder (project 2)
Here, you can search for movies, add your favorites to your personal list, and remove them whenever you like. 

# User Stories
- Have the user signup and login
- The user can search any movies and add it to their favorite movie collection
- The user can click on the movie image to see more details about that specific movie
- Allow the user to edit or delete the movie in their collection

# Installation
1. Git clone the repository
2. In the command line run the following commands once you have the project opened in vs code:
3. 
   `npm init -y`
   `npm install axios bcryptjs connect-flash`
   `npm install dotenv ejs express`
   `npm install express-ejs-layouts express-session method-override`
   `npm install mongoose mongodb passport`
   `npm install passport-local`
   

# Technologies used

## Backend:
- Node
- Express
- Passport
- Bcrypt
- dotenv
- Mongoose
- MongoDB
- Method-override

## Frontend:
- HTML
- CSS
- EJS (Embedded JavaScript)
- JavaScript

# Wireframe
![wireframe](img/wireframe.png)

# ERD
### User
id, firstName, lastName, email, password
### movie
id, movieName, genre, releaseDate
### reviews
id, content

# Current issues
- The user is able to favorite the same movie (create a duplicate)
- The user can't see the review of the specific movie in their profile page

# Future changes/considerations
- Add TV shows and different genres for the user to search
- Add a watchlist feature
