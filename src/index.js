import dotenv from "dotenv";
import express from "express";

import connectDB from "./db/db.js";


const app=express();
console.log(process.env.MONGODB_URI)
connectDB();

app.get("/",(req,res)=>{
    res.send("hello")
})
app.listen(8000,()=>console.log(`server running on port ${process.env.PORT}`))


































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