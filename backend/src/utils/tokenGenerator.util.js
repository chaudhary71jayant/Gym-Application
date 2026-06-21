import jwt from "jsonwebtoken";

const generateToken = (userId, role) => {
    return jwt.sign(
        {
            id : userId, 
            role
        },
        process.env.JWT_SECRET_KEY,
        {
            expiresIn : "6d"
        }
    );
};

export default generateToken;