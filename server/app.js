import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { config } from 'dotenv'
import UserRouter from './routes/user.route.js'
import CourseRouter from './routes/course.route.js'
import ChatRouter from './routes/googleAi.route.js'
import PaymentRouter from './routes/payment.route.js'
import morgan from 'morgan'
import errorMiddleware from './middlewares/errorMiddleware.js'
import adminRoutes from './routes/admin.route.js'
config()

const app=express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors({
    origin:process.env.FE_URL,
    credentials:true
}))
app.use(cookieParser())
app.use(morgan('dev'))


app.get('/home',(req,res)=>{
    res.send('Welcome to Home Page')
})

//routes
app.use("/api/v1/user",UserRouter)
app.use("/api/v1/course",CourseRouter)
app.use("/api/v1/chat",ChatRouter)
app.use("/api/v1/payment",PaymentRouter)
app.use('/api/v1/admin',adminRoutes)

app.use(errorMiddleware)

app.all('*',(req,res)=>{
    res.json({
        success:false,
        message:"Page not found"
    }).status(404)
})


export default app