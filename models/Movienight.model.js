const { Schema, model } = require("mongoose");
const User = require("./User.model");

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const movienightSchema = new Schema(
  {
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    participantID: [String],
    roomName: {
      type: String,
      unique: true,
      required: true,
    },
    roomPassword: String,
    movieArray: [Object],
    participants: Number,
    imdbScore: Number,
    genre: {
      type: String,
      enum: [
        "Action",
        "Adventure",
        "Animation",
        "Comedy",
        "Crime",
        "Documentary",
        "Drama",
        "Family",
        "Fantasy",
        "History",
        "Horror",
        "Music",
        "Mystery",
        "Romance",
        "Science Fiction",
        "TV Movie",
        "Thriller",
        "War",
        "Western",
      ],
    },

    numbermovies: Number,
  },
  {
    timestamps: true,
  }
);

const Movienight = model("Movienight", movienightSchema);

module.exports = Movienight;
