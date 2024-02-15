// require('dotenv').config({path: './env'})  //yaha pe path dena jaruri nhi hai but hamne path deke bataya hai ki env file kha hai usko acess kro

import dotenv from 'dotenv'
import connectDB from "./db/DBindex.js";
import { app } from './app.js';

dotenv.config({path: "./.env"})

connectDB().then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>console.log(`server is running at port : ${process.env.PORT}`))
}).catch((error)=>{
    console.log("MONGODB  connection failed !!! " , error);
})
























/*
import { express } from "express";
const app = express()

(async()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       app.on("error", (error)=>{
            console.log("ERR : " , error)  ;
            throw error
       } )

       app.listen(process.env.PORT , ()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
       })
    } catch (error) {
       console.log("ERROR=>  " , error ); 
    }
})()
*/