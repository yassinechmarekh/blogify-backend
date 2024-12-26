const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlenght: 5,
      maxlenght: 100,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlenght: 8,
    },
    username: {
      type: String,
      trim: true,
      minlenght: 2,
      maxlenght: 25,
    },
    status: {
      type: String,
      enum: ["admin", "author", "reader"],
      default: "reader",
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    profilePhoto: {
      type: Object,
      default: {
        url: "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg",
        publicId: null,
      },
    },
    job: {
      type: String,
      minlenght: 2,
      maxlenght: 50,
    },
    bio: {
      type: String,
    },
    address: {
      type: String,
    },
    socialLink: {
      type: Object,
      default: {
        facebook: null,
        instagram: null,
        twitter: null,
        linkedin: null,
      },
    },
  },
  { timestamps: true }
);

// Generate auth token
userSchema.methods.generateAuthToken = function(){
    return token = jwt.sign({ id: this._id, status: this.status }, process.env.JWT_SECRET);
}

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
