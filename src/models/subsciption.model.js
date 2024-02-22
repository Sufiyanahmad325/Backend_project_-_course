import mongoose, { Schema } from "mongoose";
const subscriptionSchema = new Schema({
    subscription:{
        type:Schema.Types.ObjectId,  //one who is subscribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,     //one to who subscriber is subscibing
        ref:"User"
    }

},{
    timestamps:true
}

)

export const Subscription = mongoose.model("subscription" , subscriptionSchema)