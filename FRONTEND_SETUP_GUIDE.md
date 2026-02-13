# Frontend Setup Guide

## Overview

This guide will help you set up the Next.js frontend application for the AI Educational Platform.

## What's Been Prepared

✅ **Backend API** - Fully functional with 12 endpoints
✅ **Database Models** - 5 core models implemented
✅ **Authentication System** - JWT-based auth ready
✅ **API Documentation** - Swagger UI at http://localhost:3001/v1/docs
✅ **Frontend Package.json** - Dependencies defined

## Quick Setup

### Option 1: Manual Setup (Recommended for Learning)

```bash
# Navigate to frontend directory
cd ai-educational-platform/frontend

# Install dependencies
npm install

# Create Next.js configuration files
# (See configuration files below)

# Run development server
npm run dev
```

### Option 2: Use Create Next App

```bash
cd ai-educational-platform

# Create Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir

# Install additional dependencies
cd frontend
npm install axios react-hook-form zod @hookform/resolvers lucide-react clsx tailwind-merge
```

## Required Configuration Files

### 1. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2. `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
```

### 3. `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}
export default config
```

### 4. `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 5. `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Frontend Structure

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── register/
│   │       └── page.tsx          # Register page
│   └── dashboard/
│       ├── layout.tsx            # Dashboard layout
│       ├── page.tsx              # Dashboard home
│       └── profile/
│           └── page.tsx          # User profile
├── components/
│   ├── ui/                       # Reusable UI components
│   ├── auth/                     # Auth-related components
│   └── layout/                   # Layout components
├── lib/
│   ├── api.ts                    # API client
│   ├── auth.ts                   # Auth utilities
│   └── utils.ts                  # General utilities
├── types/
│   └── index.ts                  # TypeScript types
├── hooks/
│   ├── useAuth.ts                # Auth hook
│   └── useApi.ts                 # API hook
└── styles/
    └── globals.css               # Global styles
```

## Core Files to Create

### 1. API Client (`lib/api.ts`)

```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        const { access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Auth Context (`lib/auth.tsx`)

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await api.get('/users/me');
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token } = response.data;
    
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    await checkAuth();
    router.push('/dashboard');
  };

  const register = async (data: any) => {
    await api.post('/auth/register', data);
    await login(data.email, data.password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 3. Login Page (`app/(auth)/login/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/register" className="text-primary-600 hover:text-primary-500">
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

## Step-by-Step Implementation

### Step 1: Initialize Frontend

```bash
cd ai-educational-platform/frontend
npm install
```

### Step 2: Create Configuration Files

Create all the configuration files listed above:
- `tsconfig.json`
- `next.config.js`
- `tailwind.config.ts`
- `postcss.config.js`
- `.env.local`

### Step 3: Create Core Files

1. Create `lib/api.ts` - API client
2. Create `lib/auth.tsx` - Auth context
3. Create `lib/utils.ts` - Utility functions

### Step 4: Create Pages

1. Create `app/layout.tsx` - Root layout
2. Create `app/page.tsx` - Home page
3. Create `app/(auth)/login/page.tsx` - Login page
4. Create `app/(auth)/register/page.tsx` - Register page
5. Create `app/dashboard/page.tsx` - Dashboard

### Step 5: Create Components

1. Create UI components in `components/ui/`
2. Create layout components in `components/layout/`
3. Create auth components in `components/auth/`

### Step 6: Add Global Styles

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }
}
```

### Step 7: Test the Frontend

```bash
# Start backend
cd ai-educational-platform
docker-compose up -d

# Start frontend
cd frontend
npm run dev
```

Visit http://localhost:3000

## Testing Checklist

- [ ] Frontend starts without errors
- [ ] Can navigate to login page
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Token is stored in localStorage
- [ ] Can access dashboard after login
- [ ] Can view user profile
- [ ] Can logout successfully
- [ ] Protected routes redirect to login

## Next Features to Implement

1. **Dashboard Pages**
   - User profile management
   - School management (admin)
   - Class management
   - Syllabus builder
   - Lesson viewer

2. **UI Components**
   - Button component
   - Input component
   - Card component
   - Modal component
   - Table component

3. **Advanced Features**
   - Real-time notifications
   - File upload
   - Data visualization
   - Search and filters
   - Pagination

## Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Hook Form**: https://react-hook-form.com/
- **Axios**: https://axios-http.com/docs/intro

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### API Connection Error

1. Check backend is running: `docker-compose ps`
2. Check API URL in `.env.local`
3. Check CORS settings in backend

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Summary

The backend is fully functional with authentication and user management. Follow this guide to build the frontend application that connects to the API.

**Current Status:**
- ✅ Backend: 20% complete
- ⏳ Frontend: 0% complete (ready to start)

**Estimated Time:**
- Basic frontend setup: 2-3 hours
- Authentication pages: 2-3 hours
- Dashboard: 4-6 hours
- Full frontend: 2-3 weeks
