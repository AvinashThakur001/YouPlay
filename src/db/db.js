import mongoose from "mongoose";
// import DB_NAME  from "../constants.js";


//async connection to database
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/YouPlay`);
    console.log(`Database connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error); // error handling
    process.exit(1);
  }
};
export default connectDB; // latter used in index.js