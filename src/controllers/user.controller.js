import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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


    const avatarLocalPath =await req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);
    // const coverImageLocalPath =await req.files?.coverImage[0]?.path;
    // console.log(coverImageLocalPath);

    let coverImageLocalPath;

    //req.files aya hai ya nhi , isArray hai wo batayega ki req.files.coverImage hai ya nhi uske bad uske bad ham check kr rhe hai ki array ki value 0 se badi hai ya nhi (agr ye true hota hai iska matalab hai ki coverImage req.files me aaya hai to usko ham coverImageLocalPath me uska path store kr lenge)
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0 ){
        coverImageLocalPath = req.files.coverImage[0].path //coverImage ek array hai uske pahle object me uska hota hai usko lelo
    }
    console.log("coverImageLocalPath = > " , coverImageLocalPath);

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




export {
    registerUser,
}

