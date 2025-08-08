# 🔐 Login System Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Copy environment file
cp .env.example .env

# Edit .env with your settings
DATABASE_URL="postgresql://username:password@localhost:5432/edtech_db"
JWT_SECRET="your-super-secret-jwt-key"
```

### 3. Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Test the System
Visit: http://localhost:3000

## 🧪 Demo Accounts

```
👨‍💼 Admin:    admin@edtech.com    / admin123
👨‍🏫 Coach:    coach@edtech.com    / coach123  
🎓 Student:   student1@edtech.com / student123
```

## 📱 Available Pages

- **/** - Landing page
- **/test** - Simple test page
- **/login** - Login form
- **/register** - Registration form
- **/dashboard** - Protected dashboard (requires login)
- **/unauthorized** - Access denied page

## 🔧 Troubleshooting

### Issue: Tailwind CSS not working
**Solution:**
```bash
# Check if Tailwind is properly installed
npm list tailwindcss

# If missing, install it
npm install -D tailwindcss

# Restart dev server
npm run dev
```

### Issue: Database connection error
**Solution:**
1. Make sure PostgreSQL is running
2. Check DATABASE_URL in .env file
3. Run: `npm run db:push`

### Issue: JWT errors
**Solution:**
1. Make sure JWT_SECRET is set in .env
2. Use a strong secret (at least 32 characters)

### Issue: Build errors
**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

### Issue: TypeScript errors
**Solution:**
```bash
# Check TypeScript config
npx tsc --noEmit

# Install missing types
npm install -D @types/node @types/react @types/react-dom
```

## 🏗️ Architecture Overview

### Frontend Stack
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Hook Form** - Form handling
- **Zod** - Validation
- **@tanstack/react-query** - Data fetching

### Backend Stack
- **Next.js API Routes** - Backend API
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Authentication Flow
1. User submits login form
2. API validates credentials
3. JWT token generated and returned
4. Token stored in localStorage
5. Middleware protects routes
6. Context provides user state

## 📂 File Structure

```
src/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── login/             # Login page
│   ├── register/          # Register page
│   ├── dashboard/         # Protected dashboard
│   └── unauthorized/      # Access denied page
├── components/
│   ├── ui/                # shadcn/ui components
│   └── auth/              # Auth-specific components
├── contexts/
│   └── AuthContext.tsx    # Authentication context
├── lib/
│   └── utils.ts           # Utility functions
└── core/api/              # API layer (React Query)
```

## 🔒 Security Features

- ✅ **Password hashing** with bcrypt
- ✅ **JWT tokens** with expiration
- ✅ **Route protection** with middleware
- ✅ **Role-based access** control
- ✅ **Input validation** with Zod
- ✅ **CSRF protection** (built into Next.js)
- ✅ **SQL injection protection** (Prisma ORM)

## 🎨 UI Features

- ✅ **Responsive design** (mobile-first)
- ✅ **Loading states** with spinners
- ✅ **Error handling** with alerts
- ✅ **Form validation** real-time
- ✅ **Password visibility** toggle
- ✅ **Demo accounts** for testing
- ✅ **Gradient themes** beautiful design
- ✅ **Dark mode** ready

## 🚀 Production Deployment

### Environment Variables
```bash
DATABASE_URL="your-production-db-url"
JWT_SECRET="your-super-secure-production-secret"
NEXTAUTH_URL="https://yourdomain.com"
```

### Build Commands
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Database Migration
```bash
# Run migrations in production
npm run db:migrate
```

## 📞 Support

If you encounter any issues:

1. Check this troubleshooting guide
2. Review the console for error messages
3. Check the Network tab for API errors
4. Verify environment variables
5. Ensure database is running and accessible

## 🎯 Next Steps

1. **Customize UI** - Modify components in `src/components/ui/`
2. **Add features** - Extend dashboard functionality
3. **Email verification** - Add email confirmation
4. **Password reset** - Implement forgot password
5. **Social login** - Add Google/GitHub OAuth
6. **2FA** - Two-factor authentication
7. **Audit logs** - Track user activities

---

**Happy coding! 🚀**
