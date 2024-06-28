import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler} from "../utils/asyncHandler.js"
const registerUser= asyncHandler(async(req, res)=>{
    // get user details from frontend
    //validation(email is empty or not)
    // check if user is already exists: username and email
    //check for images, check for avatar
    // upload them on cloudinary, avatar check
    // create user object- create entry in db
    //check for usercreation: null or create success
    // remove password and refresh token field from response
    //return response


    const {fullName, email, username, password}=req.body

    //validation
    if(
        [fullName, email, username, password].some((field)=>
        field?.trim()==="")// check for fields are null or not
    ){
        throw new ApiError(400, "All fields are required")
    }

    //check if user already exists
    const existedUser= User.findOne({
        $or:[{username}, {email}]
    })
    if(existedUser) throw new ApiError(409, "User with email or username already exists")

    //check for images
    //console.log(req.files)
    const avatarLocalPath= req.files?.avatar[0]?.path
    const coverImageLocalPath= req.files?.coverImage[0]?.path
    if(!avatarLocalPath) throw new ApiError(400, "Avatar file is required")

    //upload image to cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) throw new ApiError(400, "Avatar is required")
})

//create user
const user= await User.create({
    fullName,
    avatar:avatar.url,
    email,
    coverImage:coverImage?.url || "",
    password,
    username:username.toLowerCase()
})

const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser) throw new ApiError(500, "something went wrong while registring the user")


return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered successfully")
)


export { registerUser }