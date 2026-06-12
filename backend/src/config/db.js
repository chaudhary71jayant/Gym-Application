import mongoose from "mongoose";

const connectdb = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB is connected");
    } catch (error) {
        console.error(`Error : ${error.message}`);
        process.exit(1);
    }
}

export default connectdb;
