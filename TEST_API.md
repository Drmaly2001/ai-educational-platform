# API Testing Guide

## Prerequisites

1. Start Docker Desktop
2. Navigate to project directory:
   ```bash
   cd ai-educational-platform
   ```
3. Ensure `.env` file exists in `backend/` directory with:
   ```
   ANTHROPIC_API_KEY=your-key-here
   JWT_SECRET=your-secret-key-here
   ```

## Start the System

```bash
# Start all services
docker-compose up -d --build

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f backend
```

## Test Authentication Endpoints

### 1. Register a New User

**Request:**
```bash
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "Teacher123!",
    "full_name": "John Teacher",
    "role": "teacher"
  }'
```

**Windows (PowerShell):**
```powershell
$body = @{
    email = "teacher@example.com"
    password = "Teacher123!"
    full_name = "John Teacher"
    role = "teacher"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/v1/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "teacher@example.com",
  "full_name": "John Teacher",
  "role": "teacher",
  "is_active": true,
  "is_verified": false,
  "school_id": null,
  "created_at": "2026-02-12T20:00:00",
  "updated_at": "2026-02-12T20:00:00",
  "last_login": null
}
```

### 2. Login

**Request:**
```bash
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "Teacher123!"
  }'
```

**Windows (PowerShell):**
```powershell
$body = @{
    email = "teacher@example.com"
    password = "Teacher123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/v1/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Save the access_token for subsequent requests!**

### 3. Get Current User Profile

**Request:**
```bash
curl -X GET http://localhost:3001/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Windows (PowerShell):**
```powershell
$token = "YOUR_ACCESS_TOKEN"
Invoke-RestMethod -Uri "http://localhost:3001/v1/users/me" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $token" }
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "teacher@example.com",
  "full_name": "John Teacher",
  "role": "teacher",
  "is_active": true,
  "is_verified": false,
  "school_id": null,
  "created_at": "2026-02-12T20:00:00",
  "updated_at": "2026-02-12T20:00:00",
  "last_login": "2026-02-12T20:05:00"
}
```

### 4. Update Profile

**Request:**
```bash
curl -X PUT http://localhost:3001/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Updated Teacher"
  }'
```

**Windows (PowerShell):**
```powershell
$token = "YOUR_ACCESS_TOKEN"
$body = @{
    full_name = "John Updated Teacher"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/v1/users/me" `
  -Method Put `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

### 5. Update Password

**Request:**
```bash
curl -X PUT http://localhost:3001/v1/users/me/password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "Teacher123!",
    "new_password": "NewPassword123!"
  }'
```

**Windows (PowerShell):**
```powershell
$token = "YOUR_ACCESS_TOKEN"
$body = @{
    current_password = "Teacher123!"
    new_password = "NewPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/v1/users/me/password" `
  -Method Put `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

### 6. Refresh Token

**Request:**
```bash
curl -X POST http://localhost:3001/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

**Windows (PowerShell):**
```powershell
$body = @{
    refresh_token = "YOUR_REFRESH_TOKEN"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/v1/auth/refresh" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## Test Admin Endpoints

### 1. Create Super Admin

First, create a super admin user directly in the database:

```bash
docker exec -it edu-backend python -c "
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
admin = User(
    email='admin@example.com',
    full_name='Super Admin',
    hashed_password=get_password_hash('Admin123!'),
    role='super_admin',
    is_active=True,
    is_verified=True
)
db.add(admin)
db.commit()
print('Super admin created!')
"
```

### 2. Login as Admin

```bash
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

### 3. List All Users (Admin Only)

```bash
curl -X GET http://localhost:3001/v1/users/ \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### 4. Create User (Admin Only)

```bash
curl -X POST http://localhost:3001/v1/users/ \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "Student123!",
    "full_name": "Jane Student",
    "role": "student"
  }'
```

### 5. Update User (Admin Only)

```bash
curl -X PUT http://localhost:3001/v1/users/2 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

### 6. Delete User (Super Admin Only)

```bash
curl -X DELETE http://localhost:3001/v1/users/2 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

## Test with Postman

1. Import the following collection:

```json
{
  "info": {
    "name": "AI Educational Platform",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"teacher@example.com\",\n  \"password\": \"Teacher123!\",\n  \"full_name\": \"John Teacher\",\n  \"role\": \"teacher\"\n}"
            },
            "url": {"raw": "http://localhost:3001/v1/auth/register"}
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"teacher@example.com\",\n  \"password\": \"Teacher123!\"\n}"
            },
            "url": {"raw": "http://localhost:3001/v1/auth/login"}
          }
        }
      ]
    },
    {
      "name": "Users",
      "item": [
        {
          "name": "Get My Profile",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{access_token}}"}],
            "url": {"raw": "http://localhost:3001/v1/users/me"}
          }
        }
      ]
    }
  ]
}
```

2. Set up environment variable `access_token` after login

## Test with Browser

1. Open API Documentation: http://localhost:3001/v1/docs
2. Click "Authorize" button
3. Enter your access token
4. Test endpoints directly from the Swagger UI

## Common Issues

### 1. "Could not validate credentials"
- Token expired (tokens expire after 30 minutes)
- Invalid token format
- Solution: Login again to get a new token

### 2. "Email already registered"
- User with that email already exists
- Solution: Use a different email or delete the existing user

### 3. "Incorrect email or password"
- Wrong credentials
- Solution: Check email and password

### 4. "User account is inactive"
- User has been deactivated
- Solution: Contact admin to reactivate account

### 5. "Not authorized for this action"
- Insufficient permissions
- Solution: Login with an account that has the required role

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

## User Roles

- `super_admin`: Full system access
- `school_admin`: Manage users within their school
- `teacher`: Create and manage classes, lessons, assessments
- `student`: Access lessons, take assessments
- `parent`: View student progress

## Next Steps

1. Test all authentication endpoints
2. Create multiple users with different roles
3. Test role-based access control
4. Verify token refresh functionality
5. Test password update
6. Test user management endpoints

## Automated Testing

Once you've tested manually, you can run automated tests:

```bash
cd backend
pytest tests/test_auth.py -v
pytest tests/test_users.py -v
```

## Clean Up

```bash
# Stop services
docker-compose down

# Remove all data
docker-compose down -v
```
