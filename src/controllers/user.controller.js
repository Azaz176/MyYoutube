import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs, { rmSync } from 'fs';

// Method for generating access and refresh tokens
    const generateAccessAndRefreshTokens= async(userId)=>{
        try {
            const user=  await User.findById(userId)
            const accessToken= user.generateAcessToken()
            const refreshToken= user.generateRefreshToken()

            //save refresh token in db
            user.refreshToken= refreshToken
            await user.save({validateBeforeSave: false})

            return { accessToken, refreshToken }
        } catch (error) {
            throw new ApiError(500, "something went wrong while generating refresh and access token")
        }
    }
// Register The User
    const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    // Validation
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) throw new ApiError(409, "User with email or username already exists");

    // Check for avatar image
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Upload images to Cloudinary
    let avatar, coverImage;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        //cover image
        let coverImageLocalPath=req.files?.coverImage?.[0]?.path
        if (coverImageLocalPath) {
            coverImage = await uploadOnCloudinary(req.files.coverImage[0].path);
        }
    } catch (error) {
        throw new ApiError(500, "Error uploading images to Cloudinary");
    } 

    if (!avatar) throw new ApiError(400, "Avatar is required");

    // Create user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        email,
        coverImage: coverImage?.url || "",
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

// Login User
    const loginUser= asyncHandler(async(req, res)=>{
    // req body->data
    // username or email
    // find the user
    // password check
    // access and refresh token generate
    // send tokens in cookies

    const {username, email, password}=  req.body;
    if(!username || !email){
        throw new ApiError(400, "username or email is required")
    }

    //find the user
    const user=await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) throw new ApiError(404, "user does not exist")

    //check password
    const isPasswordValid= await user.isPasswordCorrect(password)
    if(!isPasswordValid) throw new ApiError(401, "Invalid user Credentials")

    // Access and Refresh Token
    const {accessToken, refreshToken}= await generateAccessAndRefreshTokens(user._id)

    //send in cookies
    const loggedInUser= await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly: true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
})


//  logout User

    const logoutUser= asyncHandler(async(req, res)=>{
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },
            {
                new:true
            }
        )
        const options={
            httpOnly: true,
            secure:true
        }

        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
    })
export { registerUser, loginUser, logoutUser };
