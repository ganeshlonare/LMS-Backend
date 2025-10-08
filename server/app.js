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
}))
app.use(cookieParser())
app.use(morgan('dev'))


app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to LMS Backend API',
        documentation: 'Please use the appropriate API endpoints',
        available_routes: [
            '/api/v1/user',
            '/api/v1/course',
            '/api/v1/chat',
            '/api/v1/payment',
            '/api/v1/admin'
        ]
    });
});

// User routes
app.use('/api/v1/user', UserRouter);

// Course routes
app.use('/api/v1/course', CourseRouter);

// Chat routes
app.use('/api/v1/chat', ChatRouter);

// Payment routes
app.use('/api/v1/payment', PaymentRouter);

// Admin routes
app.use('/api/v1/admin', adminRoutes);

app.use(errorMiddleware);

app.all('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: "Page not found"
    });
});


export default app