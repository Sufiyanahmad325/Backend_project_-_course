import mongoose, { Schema } from "mongoose";
const subsciptionSchema = new Schema({
    subscription:{
        type:Schema.Types.ObjectId,  //one who is subscribing
        ref:"User"
    },
    chaneel:{
        type:Schema.Types.ObjectId,     //one to who subscriber is subscibing
        ref:"User"
    }

},{
    timestamps:true
}

)

export const Subsciption = mongoose.model("subsciption" , subsciptionSchema)