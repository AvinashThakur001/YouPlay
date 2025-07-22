import express from "express";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {registerUser,
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
    } 
    from "../controllers/user.controllers.js";

const router = express.Router();   

router.route("/register").post(
    upload.fields(
        [
            {name: "avatar", maxCount: 1},
            {name: "coverImage", maxCount: 1}    
    ]),
    registerUser)

router.route("/login").post(loginUser)
router.route("/refreshToken").post(refreshAccessToken)
//
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/changePassword").patch(verifyJWT,changeCurrentPassword)
router.route("/updateUserDetails").patch(verifyJWT,UpdateUserDetails)
router.route("/changeAvatar").patch(verifyJWT,upload.single("avatar"),changeAvatar)
router.route("/changeCoverImage").patch(verifyJWT,upload.single("coverImage"),changeCoverImage)

router.route("/userInfo").get(verifyJWT,getCurrentUserInfo)
router.route("/c/:userName").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router