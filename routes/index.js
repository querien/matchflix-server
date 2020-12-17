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
  console.log(req.body);
  const {
    MovienightID,
    ParticipantID: participantID,
    currentMovie,
    vote,
  } = req.body;
  //console.log(participantID);
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

router.post("/results/:id", (req, res) => {
  console.log(req.body);
  const { MovienightID, ParticipantID: participantID } = req.body;
  console.log(participantID);
  Movienight.findByIdAndUpdate(
    MovienightID,
    {
      $pull: { participantID: participantID },
    },
    { new: true }
  ).then((responsetoFrontEnd) => {
    console.log("HEEERE", responsetoFrontEnd);
    res.json(responsetoFrontEnd);
  });
});

router.get("/results/:id", (req, res) => {
  const id = "5fda402ed159732e3921d7b1";
  console.log("In the backend, we find this", req);
  Movienight.findOne({ _id: id }).then((result) => {
    console.log(result);
    let finalCount;
    if (result.participantID.length > 0) {
      return;
    } else {
      let sortedArr = result.movieArray.sort(function (movie1, movie2) {
        // Sort by votes
        // If the first item has a higher number, move it down
        // If the first item has a lower number, move it up
        if (movie1.numVotes > movie2.numVotes) return 1;
        if (movie1.numVotes < movie2.numVotes) return -1;

        // If the votes number is the same between both items, sort alphabetically
        // If the first item comes first in the alphabet, move it up
        // Otherwise move it down
        if (movie1.imdbScore > movie2.imdbScore) return 1;
        if (movie1.imdbScore < movie2.imdbScore) return -1;
      });
      finalCount = sortedArr.slice(0, 3);
      return finalCount;
    }
  });
  return res.json(result, finalCount);
});

router.use("/auth", authRoutes);

module.exports = router;
