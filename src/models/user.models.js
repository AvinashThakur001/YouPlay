import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { validate } from "uuid";


const CoverImageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    public_id: {
        type: String,
        required : function() {
            return !! this.url
        },
        validate: {
            validator: function(value) {
               if(this.url && !value) return false
               return true
            },
            message: "Cover image is required"
        }
    }
},{_id: false})

const UserSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please fill a valid email address",
            ]
        },
        fullName:{
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        watchHistory:
            [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Video"
                }
            ]
        ,
        avatar:{
            url: {
                type: String,
                required: true
            },
            public_id: {
                type: String,
                required: true
            }
        },
        coverImage:{
            type: CoverImageSchema
        },
        password:{
            type: String,
            required: [true, "Password is required"],
            select: false
        },
        refreshToken: {
            type: String
        },
    },
    {timestamps: true});


UserSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    try{
        this.password = await bcrypt.hash(this.password, 10);
        next();
    }
    catch(err){
        console.log("password hashing failed",err);
        next(err);
    }
})

UserSchema.methods.isPasswordMatched = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

UserSchema.methods.generateAccessToken  = function(){
    return jwt.sign(
        {
            _id : this._id,
            userName: this.userName,
            email: this.email,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN}
    )
}
UserSchema.methods.generateRefreshToken  = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN}
    )
}


export const User = mongoose.models.User || mongoose.model("User", UserSchema);


