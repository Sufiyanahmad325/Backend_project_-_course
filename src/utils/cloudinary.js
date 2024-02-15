import {v2 as cloudinary} from "cloudinary"
import fs from 'fs'

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const  uploadOnCloudinary = async(localFilePath)=>{

    try {
        if(!localFilePath) return
        //upload the file on cloudinary 
      const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type:"auto",                     // ye pata krega ki file jo aarahi hai wo img hai ya video etc 
        })
        // file has been uploaded succesfully
        console.log("file is uploaded on cloudinary" , response.url);  // response => ye response ke bad (dot) url size kb etc dene se wo usko de deta hai but hamne yaha url liya hai 
        await fs.promises.unlink(localFilePath);  //yaha pe await is liye diya gya hai taki file hai wo delete ho jaye await nhi dene pe dikat hota hai 
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporory file as the uploade operation got failed
        return null
    }
}


export {
    uploadOnCloudinary
}
