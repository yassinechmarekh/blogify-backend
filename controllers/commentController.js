const asyncHandler = require('express-async-handler');
const Comment = require('../models/commentModel');
const { createCommentValidation, updateCommentValidaton } = require('../utils/validations/commentValidation');

/**----------------------------------------
 * @desc Create comment
 * @route /api/comments
 * @method POST
 * @access private (Only logged in user)
 -----------------------------------------*/
 module.exports.createCommentController = asyncHandler(async (req, res) => {
    const {error} = createCommentValidation(req.body);
    if(error){
        return res.status(400).json({message: error.details[0].message});
    }

    const comment = new Comment({
        postId: req.body.postId,
        user: req.user.id,
        content: req.body.content
    });
    await comment.save();

    res.status(201).json(comment);
 });

/**----------------------------------------
 * @desc Delete comment
 * @route /api/comments/:id
 * @method DELETE
 * @access private (Only admin or owner of the comment)
 -----------------------------------------*/
 module.exports.deleteCommentController =  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if(!comment){
        return res.status(404).json({message: 'Comment not found !'});
    }
    
    if(req.user.status === 'admin' || req.user.id === comment.user.toString()){
        await Comment.findByIdAndDelete(req.params.id);
        res.status(200).json({message: 'Comment has been deleted successfully !'});
    }else{
        res.status(403).json({message: 'Your are not authorized, only admin or owner of this comment !'});
    }
 });

 /**----------------------------------------
 * @desc Update comment
 * @route /api/comments/:id
 * @method PUT
 * @access private (Only owner of the comment)
 -----------------------------------------*/
module.exports.updateCommentController = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if(!comment){
        return res.status(404).json({message: 'Comment not found !'});
    }

    if(req.user.id !== comment.user.toString()){
        return res.status(403).json({message: 'Your are not authorized, only owner of this comment can updated !'});
    }

    const {error} = updateCommentValidaton(req.body);
    if(error){
        return res.status(400).json({message: error.details[0].message});
    }

    await Comment.findByIdAndUpdate(req.params.id,{
        $set:{
            content: req.body.content,
        }
    }, {new: true});

    res.status(200).json({message: "Comment updated successfully !"});
});