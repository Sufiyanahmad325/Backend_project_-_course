import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"



const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })  

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wronng while generating refesh and access token")
    }
}





const registerUser = asyncHandler(async (req, res) => {
    //  get user details from frontend  (frontend website or postman thender client)
    //  validation
    //  check if user already exists : username , email
    //  cheack for image , check for avatar
    //  upload them to cloudinary , avatar 
    //  create user object - create entry in db
    //  remove password and refresh token field form response
    //  check for user creation 
    //  return res

    const { fullName, email, username, password } = req.body
    // if(fullName === ""){
    //     throw new ApiError(400 , "fullName is required")
    // }

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")  //some me sare field aajayga or agar sare fild ko trim krne ke bad  bhi value empty string aaye to true return krega 
    ) {
        throw new ApiError(400, "all fields are required")
    }


    const existedUser = await User.findOne({
        $or: [{ username }, { email }]  //or => iski madad se yato username mil jaye ya email mil jaye
    })

    if (existedUser) {
        console.log("user all ready exist");
        throw new ApiError(400, "user with email or username alredy exists")
    }


    const avatarLocalPath = await req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);
    // const coverImageLocalPath =await req.files?.coverImage[0]?.path;
    // console.log(coverImageLocalPath);

    let coverImageLocalPath;

    //req.files aya hai ya nhi , isArray hai wo batayega ki req.files.coverImage hai ya nhi uske bad uske bad ham check kr rhe hai ki array ki value 0 se badi hai ya nhi (agr ye true hota hai iska matalab hai ki coverImage req.files me aaya hai to usko ham coverImageLocalPath me uska path store kr lenge)
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path //coverImage ek array hai uske pahle object me uska hota hai usko lelo
    }
    console.log("coverImageLocalPath = > ", coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log(avatar.url);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //yaha pe ham server se id ke thorugh user ko find kr rhe hai sath hi uske data ko bhi , yaha pe ham select ka use krke find data me se jo data nhi chahiye usko dalte hai
    const createUser = await User.findById(user._id).select(    //dot select => isme jo chiz nhi chahiye usko likhte hai
        "-password -refreshToken"
    )
    // console.log(createUser);

    if (!createUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }


    return res.status(201).json(
        new ApiResponse(200, createUser, "User register succassfully")
    )



})





const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email 
    // find the user
    // password check
    // access and refresh token
    // send cookie 
    const { email, username, password } = req.body

    if (!email && !username) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "user does not exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(400, "invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                user: loggedInUser, accessToken,
                refreshToken
            },
                "user logged In successfully"
            )
        )


})




const logoutUser = asyncHandler(async (req, res) => {
    console.log(req.user);
    // yaha pe hamne req.user._id se user ko find kiya hai or phir usme hamne ko object liya hai jo data ko update krta hai
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {           //set se ham find kiye hua object me refresh token ko update kr ke undefined kiya hai
                refreshToken: undefined
            }
        },
        {
            new: true        //usko dene se jo return me value milegi wo new milegi , agr usk nhi diya to old value milegi jisme purana data hoga
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out"))

})







const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, " Refresh Token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateRefreshToken(user?._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access refreshed Successfully")
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "invalid RefreshToken")
    }
})






const changepassword = asyncHandler(async (req, res) => {
    const { oldPassword, newpassword } = req.body
    // if(newpassword !== confPassword){
    //     throw new ApiError(400 , "new password and confirmpassword does not match")
    // }
    const user = await User.findById(req.user?._id)
   const isPasswordCorrect =  user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
    throw new ApiError(400 , "Invalid old password")
   }

   user.password = newpassword
   await user.save({validateBeforeSave:false})

   return res.status(200)
   .json(new ApiResponse(200, {} , "password change Successfully"))


})






const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200 , req.user , "currenctuser fetch successfully"))
})


const updateAccountDetails = asyncHandler(async(req, res)=>{

    const {fullName , email} = req.body
    if(!fullName || !email){
        throw new ApiError(400 , "All fiels are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            },
            
        },
        {new:true}

        
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200 , user , "Account details updated successfully" ))


})




const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400 , "Error while uploading on avatar")
    }

    const user = await User.findById(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}

        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200 , user , "avatar image updated successfully"))
})




const updateUsercoverImage = asyncHandler(async(req, res)=>{
    const covereImageLocalPath = req.file?.path

    if(!covereImageLocalPath){
        throw new ApiError(400 , "cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(covereImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400 , "Error while uploading on cover Image")
    }

    const user = await User.findById(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}

        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200 , user , "cover image updated successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changepassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage
}

