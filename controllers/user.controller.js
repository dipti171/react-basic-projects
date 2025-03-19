import UserModel from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';
import sendEmail from '../config/sendEmail.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';
import uploadImageCloudinary from '../utils/uploadImageCloudinary.js';
import generatedOtp from '../utils/generatedOtp.js';
import forgotPasswordTemplate from '../utils/forgotPasswordtemplate.js';
import jwt from 'jsonwebtoken';


export async function registerUserController(request, response){
    try {
        const {name,email,password}=request.body
        if(!name || !email || !password){
            return response.status(400).json({
                message: "All fields are required",
                error: true,
                success: false
            });
        }
        const user = await UserModel.findOne({email});
        if(user){
            return response.json({
                message: "User already exists",
                error: true,
                success: false
            });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        const payload = {
            name,
            email,
            password: hashPassword
        }
        const newUser = new UserModel(payload);
        const save=await newUser.save();

        const verifyEmailUrl=`${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`;

        const verifyEmail=await sendEmail({
            sendTo: email,
            subject: "Account Verification",
            html:verifyEmailTemplate({
                name,
                url: verifyEmailUrl
            })
        })

        return response.json({
            message: "User registered successfully",
            error: false,
            success: true,
            data: save
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message ||error,
            error: true,
            success: false
        });
    }

}

export async function verifyEmailController(request, response){
    try {
        const {code}=request.body

        const user=await UserModel.findOne({_id: code});

        if(user){
            return response.status(400).json({
                message: "Invalid code",
                error: false,
                success: true
            });
        }

        const updateUser=await UserModel.updateOne({_id: code},{
            verify_email:true
        })
        return response.json({
            message: "Email verified successfully",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message ||error,
            error: true,
            success: true
        });
        
    }

}

//login conroller

export async function loginController(request,response){
    try {
        const {email,password}=request.body;

        if(!email || !password){
            return response.status(400).json({
                message: "provide email and password",
                error: true,
                success: false
            });
        }

        const user=await UserModel.findOne({email});

        if(!user){
            return response.status(400).json({
                message: "User not register",
                error: true,
                success: false
            });
        }
        if(user.status!=="Active"){
            return response.status(400).json({
                message: "Contact to Admin",
                error: true,
                success: false
            });
        }

        const checkPassword=await bcryptjs.compare(password,user.password);
        if(!checkPassword){
            return response.status(400).json({
                message: "Check your password",
                error: true,
                success: false
            });
        }
    
    // const accessToken=await user.generatedAccessToken(user._id);
    // const refreshToken=await user.generatedRefreshToken(user._id);

    const accessToken=await generatedAccessToken(user._id);
    const refreshToken=await generatedRefreshToken(user._id);
    

    const cookiesOption={
        httpOnly:true,
        secure:true,
        sameSite:'None'
    }

    response.cookie('accessToken',accessToken,cookiesOption)
    response.cookie('refreshToken',refreshToken,cookiesOption)

    return response.status(200).json({
        message: "User login successfully",
        error: false,
        success: true,
        data:{
            accessToken,
            refreshToken
        }
    })

        
    } catch (error) {
        return response.status(500).json({
            message: error.message ||error,
            error: true,
            success: false
        });
        
    }
}

//logout controller

export async function logoutController(request,response){
    try {
        const userid=request.userId;   //middleware
        const cookiesOption={
            httpOnly:true,
            secure:true,
            sameSite:'None'
        }

        response.clearCookie('accessToken',cookiesOption);
        response.clearCookie('refreshToken',cookiesOption);

        const removeRefreshToken=await UserModel.findByIdAndUpdate
        (userid,{
            refresh_token: ""
        })

        return response.json({
            message: "Logout successfully",
            error: false,
            success: true
        })

        
    } catch (error) {
        return response.status(500).json({
            message: error.message ||error,
            error: true,
            success: false
        });
        
    }
}

//upload user avatar

export async function uploadAvatar(request,response){
    try {
        const userId=request.userId   //auth middliware
        const image=request.file;       //multer middliware

        const upload=await uploadImageCloudinary(image)
        
        const updateUser=await UserModel.findByIdAndUpdate(userId,{
            avatar: upload.url
        })

        return response.json({
            message:"upload profile",
            data:{
                _id:userId,
                avatar:upload.url
            }
        })
    } catch (error) {
        return response.status(500).json*({
            message:error.message||error,
            error:true,
            success:false
        })
        
    }
}

//update user details
export async function updateUserDetails(request,response){
    try {
        const userId=request.userId;
        const {name,email,mobile,password}=request.body;

        let hashPassword="";

        if(password){
            const salt=await bcryptjs.genSalt(10);
            hashPassword=await bcryptjs.hash(password,salt)
        }
        
        const updateUser=await UserModel.updateOne({_id:userId},{
            ...(name &&{name:name}),
            ...(email &&{email:email}),
            ...(mobile &&{mobile:mobile}),
            ...(password && {password:hashPassword})
        })

        return response.json({
            message:"updated user successfully",
            error:false,
            success:true,
            data:updateUser

        })
    } catch (error) {
        return response.status(500).json({
            message:error.message||error,
            error:true,
            success:false
        })
        
    }
}

//forget password not login
export async function forgotPasswordController(request,response){
    try {
        const {email}=request.body

        const user=await UserModel.findOne({email})

        if(!user){
            return response.status(400).json({
                message:"Email not available",
                error:true,
                success:false
            })
        }

        const otp=generatedOtp();
        const expireTime=new Date()+60*60*1000;

        const update=await UserModel.findByIdAndUpdate(user._id,{
            forgot_password_otp:otp,
            forget_password_expiry:new Date(expireTime).toISOString()
        })

        await sendEmail({
            sendTo:email,
            subject:"Forget password from Health-wellness",
            html:forgotPasswordTemplate({
                name:user.name,
                otp:otp
            })
        })

        return response.json({
            message:"check your email",
            error:false,
            success:true

        })

        
    } catch (error) {
        return response.status(500).json({
            message:error.message||error,
            error:true,
            success:false
        })
        
    }
}

//verify forgot password otp
export async function verifyForgotPasswordOtp(request,response){
    try {
        const {email,otp}=request.body;

        if(!email||!otp){
            return response.status(400).json({
                message:"provide required field email.otp",
                error:true,
                success:false
            })
        }

        const user=await UserModel.findOne({email})

        if(!user){
            return response.status(400).json({
                message:"Email not available",
                error:true,
                success:false
            })
        }

        const currentTime=new Date().toISOString();

        if(user.forgot_password_expiry<currentTime){
            return response.status(400).json({
                message:"otp expired",
                error:true,
                success:false
            })
        }

        if(otp!== user.forgot_password_otp){
            return response.status(400).json({
                message:"Invalid otp",
                error:true,
                success:false
            })
        }

        //if otp is not expired
        //otp ===user.forgot_password_otp
        return response.json({
            message:"otp verified successfully",
            error:true,
            success:false
        })
        
    } catch (error) {
        return response.status(500).json({
            message:error.message||error,
            error:true,
            success:false

        })
        
    }
}

//reset  the password
export async function resetpassword(request,response){
    try {
        const {email,newPassword,confirmPassword}=request.body;

        if(!email||!newPassword||!confirmPassword){
            return response.status(400).json({
                message:"provide required fields email,new password , confirm password"
            })
        }
        const user=await UserModel.findOne({email})

        if(!user){
            return response.status(400).json({
                message:"Email is not available",
                error:true,
                success:false
            })
        }
        if(newPassword!==confirmPassword){
            return response.status(400).json({
                message:"new password and confirm password must be same.",
                error:true,
                success:false
            })
        }
        
        const salt=await bcryptjs.genSalt(10);
        const hashPassword=await bcryptjs.hash(newPassword,salt)
        
        const update=await UserModel.findOneAndUpdate(user._id,{
            password:hashPassword
        })
        
        return response.json({
            message:"password updated successfully.",
            error:false,
            success:true
        })
    } catch (error) {
        return response.status(500).json({
            message:error.message||error,
            error:true,
            success:false
        })
        
    }
}

//refresh token controller
export async function refreshToken(request,response){
    try {
        const refreshToken=request.cookies.refreshToken|| request?.header?.authorization?.split(" ")[1]
        if(!refreshToken){
            return response.status(401).json({
                message:"Invalid token",
                error:true,
                success:false
            })
        }
        const verifyToken=await jwt.verify(refreshToken,process.env.SECRET_KEY_REFRESH_TOKEN)

        if(!verifyToken){
            return response.json({
                message:"token is expired",
                error:true,
                success:false
            })
        }
        
        const userId=verifyToken?._id;
        const newAccessToken=await generatedAccessToken()

        const cookiesOption={
            httpOnly:true,
            secure:true,
            sameSite:'None'
        }
        response.cookie('accessToken',newAccessToken,cookiesOption)

        return response.json({
            message:"New Access token generated",
            error:false,
            succcess:true,
            data:{
                accessToken:newAccessToken
            }
        })

    } catch (error) {
        return response.status(500).json({
            message:error.message||error,
            error:true,
            success:false
        })
        
    }
}