import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


const app = express(); // express instance
const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.static("public"));



import userRouter from "./routes/user.router.js";
app.use("/api/v1/user/",userRouter);

export default app; // exporting app to use in index

