import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { config } from 'dotenv'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import UserRouter from './routes/user.route.js'
import CourseRouter from './routes/course.route.js'
import ChatRouter from './routes/googleAi.route.js'
import PaymentRouter from './routes/payment.route.js'
import morgan from 'morgan'
import errorMiddleware from './middlewares/errorMiddleware.js'
import adminRoutes from './routes/admin.route.js'
config()

// Swagger configuration
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LMS API Documentation',
      version: '1.0.0',
      description: 'API documentation for Learning Management System',
      contact: {
        name: 'API Support',
        email: 'support@lms.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server (local)'
      },
      {
        url: 'https://lms-backend-awyl.onrender.com',
        description: 'Production server (Render)'
      },
      {
        url: process.env.API_BASE_URL || 'https://lms-backend-awyl.onrender.com',
        description: 'Production server (from environment)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js'], // Path to the API routes
}

const specs = swaggerJsdoc(options)

const app=express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
// app.use(cors({
//     origin:process.env.FE_URL,
// }))

app.use(cors({
  origin: process.env.FE_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

app.use(errorMiddleware);

app.all('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: "Page not found"
    });
});


export default app