import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import uploadOnCloudinary from "../utils/cloudinary.services.js";

const registerUser = asyncHandler(async (req, res) => {

    const {fullName, email, password, userName} = req.body;
    console.log(req.body);
    console.log("email: ", email);

    if(!fullName || !email || !password || !userName) {
        throw new ApiError(400, "All fields are required");
    }

    const userExists = await User.findOne(
        {$or :[{userName},{email}]}
    );
    if(userExists) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0].path;
    const coverImageLocalPath = req.files.coverImage[0].path;

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
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
    });
  
    const createdUser = await User.findById(user._id).select("-password");
    if(!createdUser) {
        throw new ApiError(500, "User creation failed");
    }
    return res.status(201).json(new ApiResponse(200, "User created successfully", createdUser));

});

export { registerUser };