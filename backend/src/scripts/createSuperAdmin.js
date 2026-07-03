import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']); 
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import connectdb from "../config/db.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const createSuperAdmin = async () => {
    try {
        await connectdb();

        const exsisting = await User.findOne({ role : "superAdmin" });
        if(exsisting){
            console.log("The super Admin is already exsist");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD,  12);

        await User.create({
            name : "Super Admin(Jayant)",
            email : process.env.SUPER_ADMIN_EMAIL,
            password : hashedPassword,
            role : "superAdmin",
        })

        console.log("Super Admin created successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error creating the super admin ", error.message);
        process.exit(1);
    }
}

createSuperAdmin();