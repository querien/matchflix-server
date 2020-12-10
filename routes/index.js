const router = require("express").Router();
const User = require("../models/User.model");
const authRoutes = require("./auth");
const mongoose = require("mongoose");

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

router.use("/auth", authRoutes);

module.exports = router;
