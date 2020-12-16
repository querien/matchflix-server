const router = require("express").Router();
const User = require("../models/User.model");
const Movienight = require("../models/Movienight.model");
const authRoutes = require("./auth");
const mongoose = require("mongoose");
const axios = require("axios").default;
const APIKEY = process.env.APIKEY;
const genres = require("../genres.json");
const genreObject = genres.genres[0];

const bcrypt = require("bcryptjs");
const { findByIdAndUpdate } = require("../models/User.model");
const saltRounds = 10;

/* GET home page */
router.get("/", (req, res, next) => {
  res.json("All good in here");
});

router.put("/settings", (req, res, next) => {
  const { id, username, password } = req.body;
  User.findOne({ username }).then((found) => {
    // If the user is found, send the message username is taken
    if (found) {
      return res.status(400).json({ errorMessage: "Username already taken." });
    }
    return bcrypt
      .genSalt(saltRounds)
      .then((salt) => bcrypt.hash(password, salt))
      .then((hashedPassword) => {
        return User.findByIdAndUpdate(id, {
          username: username,
          password: hashedPassword,
        });
      });
  });
});

router.post("/movienight", (req, res, next) => {
  const {
    host,
    roomName,
    roomPassword,
    participants,
    numberMovies,
    genre,
    imdbScore,
  } = req.body;
  const apiCall = axios.get(
    `https://api.themoviedb.org/3/discover/movie?api_key=${APIKEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&vote_average.gte=${imdbScore}&with_genres=${genreObject[genre]}&with_original_language=en`
  );
  const modelCreate = Movienight.create({
    host: host,
    roomName: roomName,
    roomPassword: roomPassword,
    participants: participants,
    numberMovies: numberMovies,
    genre: genre,
    imdbScore: imdbScore,
  });
  Promise.all([modelCreate, apiCall]).then((values) => {
    let moviesFromApi = values[1].data.results.slice(0, numberMovies);
    moviesFromApi.forEach((movie) => (movie.numVotes = 0));
    Movienight.findByIdAndUpdate(
      values[0]._id,
      {
        movieArray: [...moviesFromApi],
      },
      { new: true }
    ).then((sendToTheFrontEnd) => {
      console.log(sendToTheFrontEnd);
      res.json(sendToTheFrontEnd);
    });
  });
});

router.get("/movienight", (req, res) => {
  res.json("Does this work");
});

router.post("/joinroom", (req, res) => {
  const { roomName, roomPassword } = req.body;
  Movienight.findOne({ roomName: roomName }).then((roomToJoin) => {
    roomToJoin.roomPassword === roomPassword
      ? res.json({ roomToJoin })
      : res.json({ joinErr: "Wrong credentials to join the room" });
  });
});

router.post("/room/:id", (req, res) => {
  const { MovienightID, participantID, currentMovie, vote } = req.body;
  console.log(participantID);
  Movienight.findByIdAndUpdate(
    MovienightID,
    {
      $inc: { [`movieArray.${currentMovie}.numVotes`]: vote },
      $addToSet: { participantID: participantID },
    },
    { new: true }
  ).then((responsetoFrontEnd) => {
    res.json(responsetoFrontEnd);
  });
});

//   Movienight.create({
//     host: host,
//     roomName: roomName,
//     roomPassword: roomPassword,
//     participants: participants,
//     numberMovies: numberMovies,
//     genre: genre,
//     imdbScore: imdbScore,
//   })
//     .then((newMovienight) =>
//       axios.get(
//         `https://api.themoviedb.org/3/discover/movie?api_key=${APIKEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&vote_average.gte=${
//           newMovienight.imdbScore
//         }&with_genres=${
//           genreObject[newMovienight.genre]
//         }&with_original_language=en`
//       )
//     )
//     .then((APIresult) => {
//       let sendToFrontend = APIresult.data.results.slice(0, numberMovies);
//       newMovienight.movieArray = [...sendToFrontend];
//       return res.json(newMovienight);
//     })
//     .catch((error) => console.log("message:", error));
// });

router.use("/auth", authRoutes);

module.exports = router;
