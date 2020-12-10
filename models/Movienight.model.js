const { Schema, model } = require("mongoose");
const User = require("./User.model");

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const movienightSchema = new Schema(
  {
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    roomName: {
      type: String,
      unique: true,
      required: true,
    },
    roomPassword: String,
    movieArray: [String],
    participants: Number,
    imdbScore: Number,
    genre: String,
    numbermovies: Number,
  },
  {
    timestamps: true,
  }
);

const Movienight = model("Movienight", movienightSchema);

module.exports = Movienight;
