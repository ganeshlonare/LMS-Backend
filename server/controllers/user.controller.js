import User from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import { errorhandler } from '../utils/errorHandler.js';
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import sendEmail from '../utils/sendEmail.js';
import crypto from "crypto"

const cookieOptions={
    httpOnly:true,
    maxAge: 7 * 24 * 60 * 60 * 1000,//7 days
    secure:true,
}

export const register=async(req,res,next)=>{
    const {fullName , email , password} = req.body;

    try {
        const userExist=await User.findOne({email})

        if(!fullName || !email || !password){
            return next(errorhandler(400,"All the fields are required"))
        }

        if(userExist){
            return next(errorhandler(401,"User already exist"))
        }

        const user=await User.create({
            fullName,
            email,
            password:await bcryptjs.hash(password,10),
            avatar:{
                public_id:email,
                secure_url:"https://static.vecteezy.com/system/resources/previews/002/318/271/non_2x/user-profile-icon-free-vector.jpg"
            }
        })

        if(!user){
            return next(errorhandler(500,"failed to register user"))
        }

        //todo

        console.log(`req fille multer:-` , req.file)

        if(req.file){
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder:'lms',
                    hight:250,
                    width:250,
                    gravity:'faces',
                    crop:'fill'
                });

                if(result){
                    user.avatar.public_id=result.public_id
                    user.avatar.secure_url=result.secure_url

                    fs.rm(`uploads/${req.file.filename}`)
                }
            } catch (error) {
                console.log("file upload error:-",error)
                return next(errorhandler(500,error.message||"Error uploading file"))
            }
        }

        await user.save()
        user.password=undefined

        const token=await user.generateJwtToken()
        if(!token){
            return next(errorhandler(401,"token is not generated"))
        }

        res.cookie('token',token,cookieOptions)

        return res.status(201).json({
            success:true,
            message:"User registered successfully",
            user
        })

    } catch (error) {
        console.log("error in registering user")
        console.log(error)

        return res.json({
            success:false,
            message:error.message || "Error in registering user"
        }).status(500)
    }
}


//login
export const login=async (req,res,next)=>{
    const {email,password}=req.body
    try {
        if(!email || !password){
            return next(errorhandler(401,"All the fields are required"))
        }
        const user=await User.findOne({email}).select('+password')

        if(!user){
            return next(errorhandler(404,"User not found"))
        }

        console.log(user)

        const checkedPassword=await bcryptjs.compare(password,user.password)
        console.log('user:-',user.password)
        console.log(checkedPassword)

        if(!checkedPassword){
            return next(errorhandler(402,"Invalid Credentials"))
        }

        const token = await user.generateJwtToken()
        user.password=undefined
        if(!token){
            return next(errorhandler(401,"token is not generated"))
        }

        res.cookie('token',token,cookieOptions)

        return res.status(200).json({
            success:true,
            message:"User logged in successfully",
            user
        })

    } catch (error) {
        console.log('error in logging in user')
        console.log(error)
        return res.json({
            success:false,
            message:error.message||"error in logging in user"
        }).status(500)
    }
}

//logout
export const logout=(req,res)=>{
    try {
        const cookies=req.cookies.token
        console.log(cookies)
        if(!cookies){
         return next(errorhandler(404,"user not found"))
        }

    res.clearCookie('token' , { httpOnly: true, secure: true, sameSite: 'strict' })

    return res.json({
        success:true,
        message:"logged out"
    }).status(200)

    } catch (error) {
        return res.json({
            success:false,
            message:error.message||"error in log out"
        }).status(500)
    }
}

//getUser
export const getProfile=async (req,res)=>{
    try {
        const userId=req.user.id;

        const user=await User.findById(userId)

        return res.status(200).json({
            success:true,
            message:"User Details",
            user
        })
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message||"error in getting profile"
        })
    }
}

//forgot password

export const forgotPassword=async (req,res,next)=>{
    try {
        const {email} = req.body
        if(!email){
            return next(errorhandler(404,"email is required"))
        }
        
        const user= await User.findOne({email})

        if(!user){
            return next(errorhandler(404,"user not found"))
        }

        const resetToken=await user.generatePasswordResetToken()

        user.save()

        const resetPasswordUrl=`${process.env.FE_URL}/reset-password/${resetToken}`

        const subject='Reset Password'
        const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>
        \nIf the above link does not work for some reason then copy paste this link in 
         new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

        try {

            await sendEmail(email,subject,message);

            return res.status(200).json({
                success:true,
                message:`Email has been sent to your ${email} successfully`
            })
            
        } catch (error) {

            user.forgotPasswordToken=undefined;
            user.forgotPasswordTokenExpiry=undefined;

            await user.save()
            console.log('error in sending email')
            console.log(error)
            return next(errorhandler(500,error.message))
        }
        
    } catch (error) {
        console.log("error in forgot password")
        console.log(error)
        return res.status(500).json({
            success:false,
            message:error.message||"failed to forgot password"
        })
    }
}

//reset password
export const resetPassword=async (req,res,next)=>{

    const {resetToken}=req.params
    const {password}=req.body
    try {

        const forgotPasswordToken=crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

        const user=await User.findOne({
            forgotPasswordToken, 
            forgotPasswordTokenExpiry:{$gt:Date.now()}
        })

        if(!user){
            return next(errorhandler(404,"Token is invalid or expired"))
        }

        const hashedPassword=await bcryptjs.hash(password,10)

        user.password=hashedPassword;
        user.forgotPasswordToken=undefined;
        user.forgotPasswordTokenExpiry=undefined;

        user.save()

        return res.status(200).json({
            success:true,
            message:"Password is changed successfully",
        })
        
    } catch (error) {
        console.log("error in reset password")
        console.log(error)
        return res.status(500).json({
            success:false,
            message:error.message ||"failed to reset password"
        })
    }
}

//change password

export const changePassword=async (req,res,next)=>{
    const {oldPassword , newPassword}=req.body
    const {id}=req.user
    console.log("password and new password",oldPassword , newPassword)
    console.log(req.user)
    try {
        if(!oldPassword || !newPassword){
            return next(errorhandler(401,"All the fields are required"))
        }

        const user=await User.findById(id).select('+password')

        if(!user){
            return next(errorhandler(404,"User not found"))
        }

        const isPasswordCorrect=await bcryptjs.compare(oldPassword,user.password)

        if(!isPasswordCorrect){
            return next(errorhandler(401,"Incorrect password"))
        }

        const hashedPassword=await bcryptjs.hash(newPassword,10)

        user.password=hashedPassword
        user.save()

        return res.status(201).json({
            success:true,
            message:"Password is changed successfully"
        })
    } catch (error) {
        console.log("failed to change password")
        console.log(error.message)
        return res.status(500).json({
            success:false,
            message:error.message ||"failed to change password"
        })
    }
}

//update User

export const updateUser=async (req,res,next)=>{
    const {id} = req.user
    const {fullName}=req.body
    try {
        const user =await User.findById(id)
        if(!user){
            return next(errorhandler(404,"User not found"))
        }
        if(fullName){
            user.fullName=fullName
        }
        if(req.file){
            try {
                await cloudinary.v2.uploader.destroy(user.avatar.public_id)
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder:'lms',
                    hight:250,
                    width:250,
                    gravity:'faces',
                    crop:'fill'
                });

                if(result){
                    user.avatar.public_id=result.public_id
                    user.avatar.secure_url=result.secure_url

                    fs.rm(`uploads/${req.file.filename}`)
                }
            } catch (error) {
                console.log("file upload error:-",error)
                return next(errorhandler(500,error.message||"Error uploading file"))
            }
        }

        await user.save()
        return res.status(200).json({
            success:true,
            message:"User updated successfully"
        })
    } catch (error) {
        console.log("error updating user")
        console.log(error.message)
        return next(errorhandler(500,"error updating user"))
    }
}