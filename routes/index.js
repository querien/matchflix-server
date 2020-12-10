const router = require("express").Router();
const User = require("../models/User.model");
const Movienight = require("../models/Movienight.model");
const authRoutes = require("./auth");
const mongoose = require("mongoose");
const axios = require("axios").default;

const bcrypt = require("bcryptjs");
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
  console.log(host);
  Movienight.create({
    host: host,
    roomName: roomName,
    roomPassword: roomPassword,
    participants: participants,
    numberMovies: numberMovies,
    genre: genre,
    imdbScore: imdbScore,
  })
    .then((newMovienight) =>
      axios.get(
        `https://api.themoviedb.org/3/discover/movie?api_key=512eaf278b5e7663a80ea86ba79acd66&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&vote_average.gte=${newMovienight.imdbScore}&with_genres=28`
      )
    )
    .then((APIresult) => {
      console.log(APIresult.data);
      return res.json(APIresult.data);
    })
    .catch((error) => console.log("message:", error));
});

router.use("/auth", authRoutes);

module.exports = router;
