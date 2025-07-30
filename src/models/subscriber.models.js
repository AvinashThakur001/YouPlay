import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const SubscriptionSchema = new mongoose.Schema({
    subscriber:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    channel:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
},{timestamps: true});
SubscriptionSchema.plugin(mongooseAggregatePaginate);

export const Subscription = mongoose.models.Subscriber || mongoose.model("Subscription", SubscriptionSchema);