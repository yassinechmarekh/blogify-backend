const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlenght: 2,
    maxlenght: 200,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: Object,
    default: {
      url: "",
      publicId: null,
    },
  },
  content: {
    type: String,
    required: true,
    minlenght: 10,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
}, {timestamps: true, toJSON: {virtuals: true}, toObject: {virtuals: true}});

// Populate comments for this post
postSchema.virtual('comments',{
  ref: 'comment',
  foreignField: 'postId',
  localField: '_id'
});

const postModel = mongoose.model("post", postSchema);

module.exports = postModel;


