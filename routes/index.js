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
const e = require("express");
const saltRounds = 10;

/* GET home page */
router.get("/", (req, res, next) => {
  res.json("All good in here");
});

router.put("/settings", (req, res, next) => {
  console.log(
    `req.body from the put request - id: ${req.body.id} - username: ${req.body.username} - password: ${req.body.password}`
  );
  const { id, username, password } = req.body;

  if (req.body.password !== undefined) {
    User.findOne({ username }).then((found) => {
      // If the user is found, send the message username is taken

      if (found !== null && found.id !== id) {
        return res
          .status(400)
          .json({ errorMessage: "Username already taken." });
      }

      console.log(`About to be encrypted`);
      return bcrypt
        .genSalt(saltRounds)
        .then((salt) => bcrypt.hash(password, salt))
        .then((hashedPassword) => {
          // Create a user and save it in the database
          return User.findByIdAndUpdate(id, {
            username,
            password: hashedPassword,
          });
        })
        .catch((err) => {
          return res.status(400).json({
            errorMessage:
              "Something went wrong while trying to update your password",
          });
        });
    });
  } else {
    User.findOne({ username }).then((found) => {
      // If the user is found, send the message username is taken

      if (found !== null && found.id !== id) {
        return res
          .status(400)
          .json({ errorMessage: "Username already taken." });
      }
      return User.findByIdAndUpdate(id, {
        username,
      });
    });
  }
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
      //console.log(sendToTheFrontEnd);
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
  // console.log(req.body);
  const { movienightID, participantID, currentMovie, vote } = req.body;
  //console.log(participantID);
  Movienight.findByIdAndUpdate(
    movienightID,
    {
      $inc: { [`movieArray.${currentMovie}.numVotes`]: vote },
      $addToSet: { participantStartedVoting: participantID },
    },
    { new: true }
  ).then((responsetoFrontEnd) => {
    res.json(responsetoFrontEnd);
  });
});

router.post("/results/:id", (req, res) => {
  console.log(req.body);
  const { movienightID, participantID } = req.body;
  console.log(participantID);
  Movienight.findByIdAndUpdate(
    movienightID,
    {
      $addToSet: { participantsDone: participantID },
    },
    { new: true }
  ).then((responsetoFrontEnd) => {
    console.log("HEEERE", responsetoFrontEnd);
    res.json(responsetoFrontEnd);
  });
});
let count = 0;
router.get("/results/:id", (req, res) => {
  //console.log(req.params);
  count++;
  console.log(count);
  const movieId = req.params.id;
  //console.log("the id is", movieId);
  Movienight.findOne({ _id: movieId }).then((response) => {
    //  console.log("this is the response from the query", response);
    let finalCount = [];
    if (response.participantsDone.length < response.participants) {
      return res.json(false);
    } else {
      let sortedArr = response.movieArray.sort(function (movie1, movie2) {
        if (movie1.numVotes > movie2.numVotes) {
          return -1;
        } else if (movie1.numVotes < movie2.numVotes) {
          return 1;
        }
        // Else go to the 2nd item
        if (movie1.vote_average < movie2.vote_average) {
          return 1;
        } else if (movie1.vote_average > movie2.vote_average) {
          return -1;
        } else {
          // nothing to split them
          return 0;
        }
      });
      finalCount = sortedArr.slice(0, 3);
    }
    return res.json(finalCount);
  });
});

router.use("/auth", authRoutes);

module.exports = router;
