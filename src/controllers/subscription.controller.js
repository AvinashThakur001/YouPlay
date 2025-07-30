import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscriber.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id
    // TODO: toggle subscription

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }

    if(userId.toString() === channelId){
        throw new ApiError(400, "Cannot subscribe to yourself")
    }

    const existing = await Subscription.findOne({
        channel: channelId,
        subscriber: userId,
       
    })

    if(existing){
        await Subscription.findByIdAndDelete(existing?._id)
    } else {
        await Subscription.create({
            channel: channelId,
            subscriber: userId
        })
    }

    return res
    .status(200)
    .json(new ApiResponse(200,"Subscription toggled successfully",{
        channel: channelId,
        subscriber: userId,
        subscribed:!existing
    }))
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId || req.user._id


    // get page and limit from query or use defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // TODO: get subscribers of a channel
    const total = await Subscription.countDocuments({ channel: channelId });

    const subscribers = await Subscription.find({channel: channelId})
    .skip(skip)
    .limit(limit)
    .populate({
        path: "subscriber",
        select: "fullName userName avatar"
    })

    const subscriber = subscribers.map(sub => sub.subscriber)

    return res
    .status(200)
    .json(new ApiResponse(200,"Subscribers fetched successfully", 
        {total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: subscriber}
    ))

})

// controller to return channel list to which user has subscribed
// const getSubscribedChannels = asyncHandler(async (req, res) => {
//     const subscriberId = req.user._id; // or from params if public route

//     const subscribed = await Subscription.aggregate([
//         {
//             $match: {
//                 subscriber: new mongoose.Types.ObjectId(subscriberId)
//             }
//         },
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "channel",
//                 foreignField: "_id",
//                 as: "channel"
//             }
//         },
//         {
//             $unwind: "$channel"
//         },
//         {
//             $project: {
//                 _id: "$channel._id",
//                 fullName: "$channel.fullName",
//                 userName: "$channel.userName",
//                 avatar: "$channel.avatar"
//             }
//         }
//     ]);

//     return res
//         .status(200)
//         .json(new ApiResponse(200, "Subscribed channels fetched successfully", subscribed));
// })

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.params.subscriberId || req.user._id
   // const subscriberId = req.user._id;

    // Get page and limit from query or use defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Count total for pagination metadata
    const total = await Subscription.countDocuments({ subscriber: subscriberId });

    // Fetch paginated subscriptions
    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .skip(skip)
        .limit(limit)
        .populate({
            path: "channel",
            select: "fullName userName avatar"
        });

    // Extract only channel data
    const channels = subscriptions.map(sub => sub.channel);

    return res.status(200).json(new ApiResponse(200, "Subscribed channels fetched", {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: channels
    }));
})
    

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}