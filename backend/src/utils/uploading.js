import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const uploadToCloudinary = ( fileBuffer, folder = "Gym Application/profiles") => {
    return new Promise((resolve,reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type : "image",
                transformation : [{width : 500, height : 500, cropt : "fill", gravity : "face"}],
            },
            (error, result) => {
                if(error) return reject(error);
                resolve(reject);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

export default uploadToCloudinary;