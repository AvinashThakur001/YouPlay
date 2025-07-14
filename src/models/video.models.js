import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const VideoSchema = new mongoose.Schema(
    {
        videoFile:{
            type: String, // cloudnary Url
            required: true
        },
        thumbnail:{
            type: String,  // cloudnary Url
            required: true
        },
        title:{
            type: String,
            required: true,
            trim: true
        },
        description:{
            type: String,
            required: true,
            trim: true
        },
        duration:{
            type: Number, // from cloudnary
            required: true
        },
        views:{
            type: Number,
            default: 0
        },
        isPublished:{
            type: Boolean,
            default: true
        },
        owner:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true });

VideoSchema.plugin(mongooseAggregatePaginate);


export const Video = mongoose.models.Video || mongoose.model("Video", VideoSchema);
