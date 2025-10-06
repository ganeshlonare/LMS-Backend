# LMS Backend Documentation

This documentation provides instructions for connecting the frontend to the LMS backend. The backend is built with Node.js, Express, and MongoDB.

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables by creating a `.env` file in the `server` directory. See the `.env.example` section for required variables.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```
PORT=3000
FE_URL=http://localhost:5173

# MongoDB
MONGO_URI=<your-mongodb-uri>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET_KEY=<your-cloudinary-api-secret-key>

# Razorpay
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_SECRET=<your-razorpay-secret>

# JWT
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRY=<your-jwt-expiry>

# Nodemailer
SMTP_HOST=<your-smtp-host>
SMTP_PORT=<your-smtp-port>
SMTP_USERNAME=<your-smtp-username>
SMTP_PASSWORD=<your-smtp-password>
SMTP_FROM_EMAIL=<your-smtp-from-email>
```

## API Endpoints

The base URL for all API endpoints is `/api/v1`.

### User Routes

- **POST** `/user/signup` - Register a new user.
- **POST** `/user/login` - Log in a user.
- **GET** `/user/logout` - Log out a user.
- **POST** `/user/me` - Get the current user's profile.
- **POST** `/user/forgot-password` - Send a password reset link.
- **POST** `/user/reset/:resetToken` - Reset the user's password.
- **POST** `/user/change-password` - Change the user's password.
- **PUT** `/user/update` - Update the user's profile.

### Course Routes

- **GET** `/course` - Get all courses.
- **POST** `/course` - Create a new course (Admin only).
- **GET** `/course/:id` - Get lectures for a specific course.
- **DELETE** `/course/:id` - Delete a course (Admin only).
- **PUT** `/course/:id` - Update a course (Admin only).
- **POST** `/course/:id` - Add a lecture to a course (Admin only).

### Payment Routes

- **POST** `/payment/razorpay-key` - Get the Razorpay API key.
- **POST** `/payment/subscribe` - Subscribe to a course.
- **POST** `/payment/verify` - Verify a payment.
- **POST** `/payment/unsubscribe` - Unsubscribe from a course.

### Chat Routes

- **POST** `/chat/new` - Start a new chat session.

## Data Models

### User

```json
{
  "fullName": { "type": "String", "required": true },
  "email": { "type": "String", "required": true, "unique": true },
  "password": { "type": "String", "required": true },
  "avatar": {
    "public_id": { "type": "String" },
    "secure_url": { "type": "String" }
  },
  "role": { "type": "String", "enum": ["USER", "ADMIN"], "default": "USER" },
  "forgotPasswordToken": "String",
  "forgotPasswordExpiry": "Date",
  "subscription": {
    "id": "String",
    "status": "String"
  }
}
```

### Course

```json
{
  "title": { "type": "String", "required": true },
  "description": { "type": "String", "required": true },
  "category": { "type": "String", "required": true },
  "thumbnail": {
    "public_id": { "type": "String" },
    "secure_url": { "type": "String" }
  },
  "lectures": [
    {
      "title": "String",
      "description": "String",
      "lecture": {
        "public_id": { "type": "String" },
        "secure_url": { "type": "String" }
      }
    }
  ],
  "numberOfLectures": { "type": "Number", "default": 0 },
  "createdBy": { "type": "String", "required": true }
}
```
