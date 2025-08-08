# 🎓 Edtech Database Setup Guide

## Tổng quan dự án
**Edtech - Học tiếng Anh giao tiếp IT phong cách Do Thái**

Hệ thống học tiếng Anh sử dụng phương pháp "truyện chêm" - chèn từ tiếng Anh vào câu chuyện tiếng Việt để tạo phản xạ tự nhiên.

## 🏗️ Kiến trúc Database

### Core Entities:
- **User**: Học viên, coach, admin
- **Lesson**: Bài học theo chủ đề IT
- **Story**: Truyện chêm với các tỷ lệ từ tiếng Anh khác nhau
- **StoryChunk**: Đoạn nhỏ của truyện (để hiển thị linh hoạt)
- **Vocabulary**: Từ vựng trọng tâm
- **Audio**: File âm thanh (gốc, chêm, ghi âm học viên)
- **Quiz**: Bài kiểm tra
- **UserResult**: Kết quả học tập
- **Feedback & Reflection**: Phản hồi và sáng tạo

## 🚀 Setup Instructions

### 1. Prerequisites
```bash
# Install PostgreSQL
# Windows: Download from https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
# Windows: Services -> PostgreSQL
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql
```

### 2. Database Setup
```bash
# Create database
createdb edtech_db

# Or using psql
psql -U postgres
CREATE DATABASE edtech_db;
\q
```

### 3. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/edtech_db?schema=public"
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Database Migration & Seed
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed

# Open Prisma Studio (optional)
npm run db:studio
```

## 📊 Sample Data Overview

Sau khi seed, bạn sẽ có:

### Users:
- **Admin**: admin@edtech.com / admin123
- **Coach**: coach@edtech.com / coach123  
- **Students**: student1@edtech.com, student2@edtech.com / student123

### Sample Lessons:
1. **Giới thiệu bản thân trong công việc IT** (Beginner)
2. **Thảo luận về dự án phần mềm** (Intermediate)

### Sample Story (Truyện chêm):
```
Hôm nay tôi có một interview quan trọng. Tôi đã prepare rất kỹ lưỡng. 
Khi vào phòng, interviewer chào tôi rất friendly. Họ hỏi về experience và skills của tôi. 
Tôi explain về các projects đã làm và technical knowledge. 
Cuối cùng, họ nói sẽ contact tôi trong vài ngày tới.
```

### Vocabulary Examples:
- **interview** - phỏng vấn
- **experience** - kinh nghiệm  
- **skills** - kỹ năng
- **deadline** - hạn chót
- **requirements** - yêu cầu

## 🎯 Phương pháp "Truyện chêm"

### Story Types:
- **original**: Truyện gốc tiếng Việt
- **chemdanhtu**: Chêm danh từ tiếng Anh
- **chemdongtu**: Chêm động từ tiếng Anh  
- **chemtinhtu**: Chêm tính từ tiếng Anh
- **custom**: Chêm tùy chỉnh

### Chunk Types:
- **normal**: Văn bản tiếng Việt thường
- **chem**: Từ tiếng Anh được chêm
- **explain**: Giải thích/dịch nghĩa

## 🔧 Database Commands

```bash
# Reset database (careful!)
npm run db:reset

# Create new migration
npm run db:migrate

# View database in browser
npm run db:studio

# Generate Prisma client after schema changes
npm run db:generate
```

## 📱 API Endpoints (sẽ tạo)

```
GET    /api/lessons              # Danh sách bài học
GET    /api/lessons/:id          # Chi tiết bài học
GET    /api/stories/:id          # Truyện chêm
GET    /api/vocabularies         # Từ vựng
POST   /api/user-results         # Lưu kết quả học tập
GET    /api/user-progress        # Tiến trình học tập
POST   /api/audio/upload         # Upload file âm thanh
```

## 🎨 Frontend Features (sẽ phát triển)

- **Story Reader**: Hiển thị truyện với từ chêm highlight
- **Audio Player**: Phát âm thanh với waveform
- **Vocabulary Trainer**: Luyện từ vựng với spaced repetition
- **Speaking Practice**: Ghi âm và so sánh với mẫu
- **Progress Tracking**: Theo dõi tiến trình học tập
- **Quiz System**: Hệ thống kiểm tra đa dạng

## 🔍 Monitoring & Analytics

- Query performance tracking
- User learning analytics  
- Audio processing metrics
- Error monitoring

## 📚 Next Steps

1. Tạo API endpoints cho từng entity
2. Xây dựng UI components cho story reader
3. Tích hợp audio processing
4. Implement authentication
5. Tạo dashboard cho coach/admin
6. Mobile app development

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly  
5. Submit pull request

---

**Happy Learning! 🚀📚**
