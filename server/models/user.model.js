import {Schema , model} from 'mongoose'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const userSchema=new Schema({
    fullName:{
        type:String,
        required:[true,"Name is required"],
        minLength:[2,"Name must be grater than 2 characters"],
        maxLength:[30,"Name must be less than 30 characters"],
        lowercase:true,
        trim:true
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true,
        lowercase:true,
        trim:true,
        match:[
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Enter a valid email address'
        ]
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minLength:[8,"Password must be grater than 8 characters"],
        maxLength:[100,"Password must be less than 100 characters"],
        select:false
    },
    avatar:{
        public_id:{
            type:String
        },
        secure_url:{
            type:String
        }
    },
    role:{
        type:String,
        enum:['USER','ADMIN'],
        default:'USER'
    },
    forgotPasswordToken:String,
    forgotPasswordTokenExpiry:Date,
    token:String,
    courses:{
        type :[Schema.Types.ObjectId],
        ref :'course',
        default:[]
    }
},{
    timestamps:true
})

userSchema.methods={
    generateJwtToken:async function(){
        return await jwt.sign({
            id:this._id,
            email:this.email,
            subscription:this.subscription,
            role:this.role
        }, 
        process.env.JWT_SECRET_KEY , 
        {
            expiresIn:process.env.JWT_SECRET_KEY_EXPIRY
        })
    },
    generatePasswordResetToken:async function(){
        const resetToken=crypto.randomBytes(20).toString('hex');
        this.forgotPasswordToken=crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
        this.forgotPasswordTokenExpiry=Date.now()+15*60*1000 ;//15 mins from now

        return resetToken;
    }
}

const User = model('User',userSchema)

export default User
