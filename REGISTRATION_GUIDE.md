# 📋 GRAPHURA CRM — ADMIN REGISTRATION GUIDE

## Overview

This guide explains the **production-level admin registration system** implemented for Graphura CRM. The registration process is a secure, multi-step workflow that includes email verification, password validation, and automatic tenant setup.

---

## 🏗️ Architecture

### Multi-Step Registration Flow

```
Step 1: Company & Admin Details → Step 2: Email Verification (OTP) → Step 3: Password & Security
```

### Data Flow Diagram

```
Frontend (React)
    ↓
Register.jsx (Multi-step form)
    ↓
authService.js (API calls via Axios)
    ↓
API Endpoints (/api/auth/*)
    ↓
Backend Controllers (auth.controller.js)
    ↓
Validation (Joi schemas)
    ↓
Email Service (Brevo API)
    ↓
Database Models (MongoDB)
    ↓
Auto-Setup (Departments, Invoice Counter)
```

---

## 🔐 Security Features

### 1. **Email Verification with OTP**
- 6-digit OTP sent to email
- TTL: 10 minutes (auto-delete)
- Max 5 failed attempts per email
- One-time use (prevents replay attacks)
- Cooldown: 2 minutes before resend

### 2. **Password Requirements**
- Minimum 8 characters
- Must contain: Uppercase + Lowercase + Digit + Special Character (@$!%*?&)
- Hashed with bcrypt (salt: 10 rounds)
- Confirmed password validation

### 3. **Token Management**
- Access Token: 2-hour expiry
- Refresh Token: 7-day expiry
- JWT signed with environment secrets
- Tokens stored in localStorage (frontend) and DB (backend)

### 4. **Rate Limiting & Validation**
- Joi schema validation on all inputs
- Duplicate email prevention
- Phone number format validation
- Security code (4-digit) verification

### 5. **Multi-Tenancy**
- Each admin = one isolated tenant
- All data scoped by `admin` field
- Auto-created default departments
- Atomic invoice counter per admin

---

## 📦 What Gets Auto-Created

When an admin successfully registers:

```javascript
1. Admin Document
   - Name, Email, Phone
   - Company info (name, address, logo)
   - Subscription (TRIAL plan)
   - User limit: 40 (configurable)
   - Client limit: 6000 (configurable)

2. Default Departments
   - SALES Department
   - FINANCE Department
   - MANAGEMENT Department

3. Invoice Counter
   - Prefix: "INV"
   - Sequence: 0 (auto-increments)
   - Used for atomic invoice generation

4. Tokens Generated
   - Access Token (2h expiry)
   - Refresh Token (7d expiry)
   - Stored in RefreshToken collection

5. Confirmation Email
   - Welcome message
   - Getting started guide
   - Dashboard login link
```

---

## 🛠️ Setup Instructions

### Backend Setup

#### 1. Install Dependencies

```bash
cd backend
npm install bcryptjs joi axios crypto-js express-rate-limit
```

#### 2. Configure Environment Variables

Copy `.env.local` and update:

```env
# Critical for production:
JWT_SECRET=<strong-random-32-char-string>
JWT_REFRESH_SECRET=<strong-random-32-char-string>

# Email Service:
BREVO_API_KEY=<your-brevo-api-key>
BREVO_SENDER_EMAIL=noreply@graphura.com

# Database:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/graphura

# Frontend URL (for CORS):
FRONTEND_URL=http://localhost:5173
```

#### 3. Start Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Frontend Setup

#### 1. Install Dependencies

```bash
cd frontend
npm install axios
```

#### 2. Create `.env.local` (if needed)

```env
VITE_API_URL=http://localhost:3000/api
```

#### 3. Start Frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 📡 API Endpoints

### 1. Send OTP

```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "admin@company.com",
  "adminName": "John Doe"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "email": "admin@company.com"
  },
  "message": "OTP sent successfully",
  "success": true
}
```

**Errors:**
- `409`: Email already registered
- `429`: OTP sent recently (cooldown)
- `500`: Email service failed

---

### 2. Verify OTP

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "admin@company.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "email": "admin@company.com",
    "verified": true
  },
  "message": "OTP verified successfully",
  "success": true
}
```

**Errors:**
- `400`: Invalid OTP, expired, or already used
- `429`: Too many attempts (>5)

---

### 3. Register Admin

```http
POST /api/auth/register
Content-Type: application/json

{
  "companyName": "ABC Corporation",
  "companyEmail": "company@abc.com",
  "companyPhone": "9876543210",
  "companyAddress": "123 Business Park, Ahmedabad",
  "adminName": "John Doe",
  "adminEmail": "admin@company.com",
  "adminPhone": "9876543210",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123",
  "securityCode": "1234"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "admin": {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "admin@company.com",
      "company": "ABC Corporation"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Registration successful. Welcome to Graphura CRM!",
  "success": true
}
```

**Errors:**
- `400`: Email not verified, validation errors
- `409`: Email already registered

---

### 4. Resend OTP

```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "admin@company.com",
  "adminName": "John Doe"
}
```

---

## 🧪 Testing the Flow

### Option 1: Using Postman/Thunder Client

1. **Send OTP**
   ```
   POST http://localhost:3000/api/auth/send-otp
   Body:
   {
     "email": "test@company.com",
     "adminName": "Test Admin"
   }
   ```

2. **Verify OTP** (check your email or logs)
   ```
   POST http://localhost:3000/api/auth/verify-otp
   Body:
   {
     "email": "test@company.com",
     "otp": "123456"
   }
   ```

3. **Register**
   ```
   POST http://localhost:3000/api/auth/register
   Body: [full registration payload]
   ```

### Option 2: Using Frontend UI

1. Navigate to `http://localhost:5173/register`
2. Fill in Step 1 (Company & Admin details)
3. Click "Continue"
4. Check email for OTP (or check backend logs in dev mode)
5. Enter OTP in Step 2
6. Click "Verify"
7. Fill in Step 3 (Password & Security Code)
8. Click "Create Account"

### Option 3: Using cURL

```bash
# Step 1: Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "adminName": "Test User"
  }'

# Step 2: Verify OTP (replace with actual OTP from email)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "otp": "123456"
  }'

# Step 3: Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Corp",
    "companyEmail": "company@test.com",
    "companyPhone": "1234567890",
    "companyAddress": "Test Address",
    "adminName": "Test User",
    "adminEmail": "admin@test.com",
    "adminPhone": "1234567890",
    "password": "TestPass@123",
    "confirmPassword": "TestPass@123",
    "securityCode": "1234"
  }'
```

---

## 📊 Database Models

### Admin Model

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  company: {
    name: String,
    email: String,
    phone: String,
    logo: String,
    address: {
      line1: String,
      city: String,
      state: String,
      country: String
    }
  },
  userLimit: Number,
  clientLimit: Number,
  leadLimits: {
    SALES_EXECUTIVE: Number,
    SALES_TL: Number,
    SALES_MANAGER: Number
  },
  plan: ObjectId (ref: SubscriptionPlan),
  planStatus: String (TRIAL, ACTIVE, EXPIRED),
  isActive: Boolean,
  isProfileComplete: Boolean,
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### EmailVerification Model

```javascript
{
  _id: ObjectId,
  email: String,
  otp: String,
  attempts: Number (0-5),
  isVerified: Boolean,
  createdAt: Date (TTL: 600 seconds - auto-delete),
  updatedAt: Date
}
```

### RefreshToken Model

```javascript
{
  _id: ObjectId,
  token: String,
  holderType: String (ADMIN | USER),
  holderId: ObjectId,
  isRevoked: Boolean,
  revokedAt: Date,
  expiresAt: Date (TTL: auto-delete),
  createdAt: Date
}
```

---

## 🔍 Debugging

### Check Server Logs

Look for these messages:

```
✅ OTP email sent successfully to admin@company.com
✅ OTP verified for admin@company.com
✅ New Admin registered: admin@company.com
✅ Default departments created for admin: 65a1b2c3...
✅ Invoice counter created for admin: 65a1b2c3...
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "OTP not received" | Check BREVO_API_KEY is correct. Check spam folder. Check backend logs. |
| "Email already registered" | Use a different email or reset the database. |
| "Validation error" | Check all required fields, phone format (10 digits), password complexity. |
| "Connection timeout" | Ensure MongoDB and Brevo are accessible. Check network. |
| "CORS error" | Verify FRONTEND_URL matches your frontend URL. |

### Database Debugging

```javascript
// MongoDB shell
use graphura-crm

// Check admin
db.admins.findOne({ email: "admin@company.com" })

// Check email verification records
db.emailverifications.find()

// Check refresh tokens
db.refreshtokens.find({ holderId: ObjectId("...") })

// Check departments
db.departments.find({ admin: ObjectId("...") })

// Check invoice counter
db.invoicecounters.findOne({ admin: ObjectId("...") })
```

---

## 📋 Production Checklist

Before deploying to production:

- [ ] Set strong JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Configure Brevo API key with production sender email
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS (use helmet middleware)
- [ ] Configure rate limiting (express-rate-limit)
- [ ] Set up MongoDB backups
- [ ] Enable MongoDB authentication
- [ ] Use environment variables (never hardcode secrets)
- [ ] Test email delivery thoroughly
- [ ] Set up monitoring and alerts
- [ ] Implement logging to external service (Winston, Sentry)
- [ ] Use CDN for static assets
- [ ] Enable CORS only for trusted domains
- [ ] Implement request validation on all endpoints
- [ ] Test with various network conditions
- [ ] Performance testing (load testing)

---

## 🚀 Next Steps

After registration is working:

1. **Implement Admin Login**
   - JWT validation middleware
   - Refresh token rotation
   - Logout endpoint

2. **Add Admin Dashboard**
   - Profile completion flow
   - Team member creation
   - Subscription management

3. **Implement User Management**
   - Admin creates department members
   - Auto-generate default password
   - User first-login flow

4. **Add Email Verification for Users**
   - Similar OTP flow for user registration
   - Welcome emails

5. **Implement Refresh Token Rotation**
   - Auto-refresh on expiry
   - Revoke old tokens

6. **Add 2FA (Two-Factor Authentication)**
   - TOTP (Time-based OTP)
   - SMS verification

---

## 📚 File Structure Reference

```
Backend:
├── src/
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── routes/
│   │   └── auth.js
│   ├── services/
│   │   ├── auth.service.js (password, JWT)
│   │   └── email.service.js (Brevo)
│   ├── models/
│   │   └── index.js (36 models including Admin, EmailVerification)
│   ├── middleware/
│   │   └── validate.js (Joi validation)
│   ├── validators/
│   │   └── auth.validator.js (Joi schemas)
│   ├── utils/
│   │   ├── appError.js
│   │   ├── catchAsync.js
│   │   ├── apiResponse.js
│   │   ├── generateOTP.js
│   │   └── logger.js
│   └── server.js

Frontend:
├── src/
│   ├── pages/auth/
│   │   ├── Register.jsx
│   │   └── Register.css
│   ├── services/
│   │   ├── apiClient.js
│   │   └── authService.js
│   └── routes/
│       └── AppRoutes.jsx
```

---

## 🆘 Support & Contact

For issues or questions:
1. Check the logs (backend and browser console)
2. Review this guide's debugging section
3. Verify environment variables
4. Check MongoDB connection
5. Verify Brevo API key and sender email

---

## 📄 License

This registration system is part of Graphura CRM and follows the same license terms.

---

**Happy Registration! 🎉**
