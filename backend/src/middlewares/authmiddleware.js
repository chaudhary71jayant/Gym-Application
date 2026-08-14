import jwt from "jsonwebtoken";

const authMiddleware = (req,res,next) => {
    try {
       const token = req.cookies.token;
       
       if(!token){
        return res.status(401).json({
            message : "No token Provided"
        });
       }

       const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY
       );

       req.user = decoded

       next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired" });
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        next(error);
    }
}

export default authMiddleware;