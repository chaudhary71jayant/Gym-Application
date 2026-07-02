import multer from "multer";

const errorHandler = (err, req, res, next) => {
    if(err instanceof multer.MulterError) {
        if(err.code === 'LIMIT_FIELD_SIZE'){
            return res.status(400).json({
                message : "Image must be smaller than 5MB"
            });
        }
        return res.status(400).json({
            message : `upload error : ${err.message}`
        });
    }

    if(err.message && err.message.includes("image formats are not allowed")) {
        return res.status(400).json({
            message: err.message
        });
    }

    if(err.name === "ValidationError") {
        const message = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            message: message.join(", ")
        });
    }

    if(err.code === 11000){
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({ message : `${field} already exsist`});
    }

    console.log(err.stack);
    res.status(err.statusCode || 500).json({
        message : err.message || "Internal Storage Error",
    });
};

export default errorHandler;