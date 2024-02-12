import  express  from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";


const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))


app.use(express.json({limit:"16kb"}))                     // yaha pe mai json data accept kr rha hu or json data ka size 16kb se bada hoga to accept nhi krunga

app.use(express.urlencoded({extended:true ,limit:"16kb"}))

app.use(express.static("public"))  // file folder ya pdf etc dete hai to usko store kr dunga , jayse img(aset) , pdf , file , folder , etc 

app.use(cookieParser())  // cookie store and read krta hai 





//---Routes import

import userRouter from "./routes/user.routes.js";;


//routes declearation 
app.use("/api/v1/users" , userRouter)






export {app}