const jwt = require('jsonwebtoken')

// Verify Token
function verifyToken(req,res,next){
    const authToken = req.headers.authorization;
    if(authToken){
        const token = authToken.split(' ')[1];
        try {
            const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decodedPayload;
            next();
        } catch (error) {
            return res.status(401).json({message: 'Invalid token, access denied'});
        }
    }else{
        return res.status(401).json({message: 'No token provided, access denied'});
    }
}

// Verify Token And Admin
function verfiyTokenAndAdmin(req, res, next){
    verifyToken(req, res, () => {
        if(req.user.status === 'admin'){
            next();
        }else{
            return res.status(403).json({ message: 'Only admin, access denied !' })
        }
    })
}

// Verify Token And User himself
function verfiyTokenAndUser(req, res, next){
    verifyToken(req, res, () => {
        if(req.user.id === req.params.id){
            next();
        }else{
            return res.status(403).json({ message: 'Only user himself, access denied !' })
        }
    })
}

// Verify Token And Authorization
function verfiyTokenAndAuthorization(req, res, next){
    verifyToken(req, res, () => {
        if(req.user.id === req.params.id || req.user.status === 'admin'){
            next();
        }else{
            return res.status(403).json({ message: 'Only admin or user himself, access denied !' })
        }
    })
}

module.exports = { verifyToken, verfiyTokenAndAdmin, verfiyTokenAndUser, verfiyTokenAndAuthorization };