const mongoose = require('mongoose');

function validateObjectId(req, res, next){
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
        return res.status(400).json({message: 'Invalid id'});
    }
    next();
}

// Not found midlleware
function notFound(req, res, next){
    const error = new Error(`Not Found ${req.originalUrl}`);
    res.status(404);
    next(error);
}

// Error handler middleware
function errorHandler(err, req, res, next){
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
}

module.exports = {validateObjectId, notFound, errorHandler};