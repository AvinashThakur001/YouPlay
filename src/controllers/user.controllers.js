import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import uploadOnCloudinary , {deleteFromCloudinary} from "../utils/cloudinary.services.js";
import jwt from "jsonwebtoken";
import { Subscription } from "../models/subscriber.models.js";
import mongoose from "mongoose";


const generateAccessAndRefreshToken = async(userId) => {

    try {
        const user = await User.findById(userId);
        if(!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken; 
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
    
}


const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none"
}


const registerUser = asyncHandler(async (req, res) => {

    const {fullName, email, password, userName} = req.body;
    console.log(req.body);

    if(!fullName || !email || !password || !userName) {
        throw new ApiError(400, "All fields are required");
    }

    const userExists = await User.findOne(
        {$or :[{userName},{email}]}
    );
    if(userExists) {
        throw new ApiError(409, "User with email or username already exists");
    }

    console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0].path;
    // const coverImageLocalPath = req.files.coverImage[0].path || null; //vs
    let coverImageLocalPath 
    if(req.files && Array.isArray(req.files.coverImage)) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(500, "Image upload failed");
    }

    const user = await User.create({
        fullName,
        email,
        password,
        userName: userName.toLowerCase(),
        avatar: {
            public_id: avatar.public_id,
            url: avatar.url
        },
        coverImage: coverImage?.url ? {
            url: coverImage.url,
            public_id: coverImage.public_id
        } : undefined || null,
    });
  
    const createdUser = await User.findById(user._id).select("-password");
    if(!createdUser) {
        throw new ApiError(500, "User creation failed");
    }
    console.log(createdUser);
    return res.status(201).json(new ApiResponse(200, "User created successfully", createdUser));

});


const loginUser = asyncHandler(async(req,res)=>{

    const {email,password,userName} = req.body;

    if (!password) {
         throw new ApiError(400, "Password is required");
    }
    if (!email && !userName) {
         throw new ApiError(400, "Email or username is required");
    }

    const user = await User.findOne(
        {$or :[{email},{userName}]}
    ).select("+password"); 

    if(!user) {
        throw new ApiError(404, "User not found");
    }

    const ValidatePassword = await user.isPasswordMatched(password);

    if(!ValidatePassword) {
        throw new ApiError(401, "Invalid password");
    }
    
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    
    const loggedInUser = await User.findById(user._id).select("-refreshtoken");
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, "Login successful", {
        accessToken,
        refreshToken,
        user: loggedInUser
    }));


});


const logoutUser = asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(req.user._id, 
       {$unset : {refreshToken: 1}},
       {new: true}
   )

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, "Logout successful",{}));
})


const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(400, "Refresh token is required");
    }
    
    
        // const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        // if(!decodedToken){
        //     throw new ApiError(401, "Invalid refresh token");
        // }
        let decodedToken;
        try {
            decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            throw new ApiError(401, "Invalid refresh token");
        }
    
        const user = await User.findById(decodedToken._id);
        if(!user){
            throw new ApiError(401, "User not found");
        }

        if(user.refreshToken !== incomingRefreshToken){
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            throw new ApiError(401, "Invalid refresh token");
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
        
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, "Access token refreshed successfully", {
            accessToken,
            refreshToken: newRefreshToken
        }))
    
    
})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    
    const {oldPassword , newPassword , confirmPassword} = req.body;

    if(!oldPassword || !newPassword || !confirmPassword){
        throw new ApiError(400, "All fields are required");
    }

    if(newPassword !== confirmPassword){
        throw new ApiError(400, "New password and confirm password do not match");
    }
    const user = await User.findById(req.user?._id).select("+password");

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordMatched = await user.isPasswordMatched(oldPassword);

    if(!isPasswordMatched){
        throw new ApiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    user.refreshToken = null;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "Password changed successfully",{}));
});


const UpdateUserDetails = asyncHandler(async(req,res)=>{

    const {fullName, email, userName} = req.body;

    if(!(fullName || email || userName)){
        throw new ApiError(400, "give a feild to update");
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Invalid email format");
    }

    let uniqueTrueCondition = [];
    if(email) {
        uniqueTrueCondition.push({email});
    }
    if(userName) {
        uniqueTrueCondition.push({userName});
    }

   if(uniqueTrueCondition.length > 0) {
    const userExists = await User.findOne({
        $or: uniqueTrueCondition,
        _id: { $ne: req.user._id } // exclude self
    });

    if (userExists) {
        throw new ApiError(400, "Email or username already exists");
    }
   }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (userName) updateData.userName = userName;


    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : updateData
        },
        {new: true});

    return res
    .status(200)
    .json(new ApiResponse(200, "User details updated successfully",user));
});


const changeAvatar = asyncHandler(async(req,res)=>{

    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar required");
    }

    await deleteFromCloudinary(req.user?.avatar?.public_id);

    let avatar = "";
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
    } catch (error) {
        throw new ApiError(500, "Failed to upload avatar");
    }
    if(!avatar && avatar !== ""){
        throw new ApiError(500, "Failed to upload avatar");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar:{ 
                    url: avatar.url,
                    public_id: avatar.public_id
                }
            }
        },
        {new: true});

        return res
        .status(200)
        .json(new ApiResponse(200, "Avatar updated successfully",user));

})


const changeCoverImage = asyncHandler(async(req,res)=>{

    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image required");
    }

    await deleteFromCloudinary(req.user?.coverImage?.public_id);

    let coverImage;
        try {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
    } catch (error) {
             throw new ApiError(500, "Failed to upload cover image");
    }

    if(!coverImage){
        throw new ApiError(500, "Failed to upload cover image");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {$set: {
            coverImage: {
                url:coverImage.url, 
                public_id:coverImage.public_id
            }
        }},
        {new: true});
        
        return res
        .status(200)
        .json(new ApiResponse(200, "Cover image updated successfully",user));
});


const getCurrentUserInfo = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id);
    return res
    .status(200)
    .json(new ApiResponse(200, "User details fetched successfully",user));
});


const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {userName} = req.params;
    if(!userName?.trim()){
        throw new ApiError(400, "Username missing");
    }
    
    const channel = await User.aggregate([
        {
            $match:{
                userName : userName?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:_id,
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:_id,
                foreignField:"subscriber",
                as:"subscriberd_to"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedTo:{
                    $size:"$subscribed_to"
                },
                isSubscribed:{
                    $condition:{
                       if:{$in:[req.user?._id , "$subscribers.subscriber"]},
                       $then:true,
                       else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                userName:1,
                subscribersCount:1,
                channelSubscribedTo:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }        
    ])

    if(!channel.length){
        throw new ApiError("404","channel not found")
    }

    return res
    .status("200")
    .json(
        new ApiResponse("200","channel fetched sucessfully",channel[0])
    )

});


const getWatchHistory = asyncHandler(async(req,res)=>{
    const user =  await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    fullName:1,
                                    userName:1,
                                    avatar:1
                                }
                            }
                         ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{$arrayElemAt:["$owner",0]}
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, "Watch history fetched successfully",user[0].watchHistory));
})


export { registerUser,
         loginUser,
         logoutUser,
         refreshAccessToken,
         changeCurrentPassword,
         UpdateUserDetails,
         changeAvatar,
         changeCoverImage,
         getCurrentUserInfo,
         getUserChannelProfile,
         getWatchHistory,
        };


