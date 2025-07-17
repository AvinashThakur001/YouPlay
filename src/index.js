// import vaiables from .env;
import dotenv from "dotenv";

import connectDB from "./db/db.js"; //import connectDB from db/db.js
import app from "./app.js"; //import app from app.js
 
const PORT = process.env.PORT || 3000; // port number
//calling conect to bd function
connectDB()
.then(()=>{
    console.log("connected to database sucessfully ");
    app.on("error",error=>console.log(error)) //error handling
    app.listen(PORT ,()=>console.log(`server running on port ${PORT}`))//listening to port
})
.catch((error)=>{
    console.log("error connecting to database",error);s
});



































/*
import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "./constants.js";
import dotenv from "dotenv";
dotenv.config() 

;(async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL//${DB_NAME})
        console.log("connected to database")
        app.on("error",error=>console.log(error))
        app.listen(8000,()=>console.log(`server running on port {process.env.PORT}`))
    }catch(error){
        console.log(error)  
    }
    }
)()*/