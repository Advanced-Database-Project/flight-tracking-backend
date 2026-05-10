
import mongoose from "mongoose";
import env from "./env.js";

const connectMongoDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

const connectOpenskyMongoDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_LOCAL_URI);
    console.log("open sky MongoDB connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

export default connectMongoDB;
export {connectOpenskyMongoDB}