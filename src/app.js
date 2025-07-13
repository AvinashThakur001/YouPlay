import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


const app = express(); // express instance
const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
}


//core middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({limit: "16kb", extended: true}));
app.use(express.static("public"));

export default app; // exporting app to use in index
