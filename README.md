# HUMSJ Academic Library Bot 📚

A Telegram bot for accessing academic resources including PDFs, slides, books, and past exams.

## Project Structure

```
humsj-telegram-bot/
├── bot.js                      # Main bot entry point
├── .env                        # Environment variables
├── package.json                # Dependencies and scripts
├── db/
│   ├── mongoose.js             # MongoDB connection
│   └── schemas/
│       ├── index.js            # Schema exports
│       ├── College.js          # College model
│       ├── Department.js       # Department model
│       ├── Course.js           # Course model
│       ├── Resource.js         # Resource model
│       └── User.js             # Bot user model
├── commands/
│   └── test.js                 # /testdb command
├── handlers/
│   ├── collegeHandler.js       # /browse & college list
│   ├── departmentHandler.js    # Department selection
│   ├── yearHandler.js          # Year selection
│   ├── semesterHandler.js      # Semester selection
│   ├── courseHandler.js        # Course selection
│   ├── chapterHandler.js       # Chapter selection
│   └── resourceHandler.js      # Resource delivery
├── utils/
│   └── sessionManager.js       # User session state
├── scripts/
│   └── seed.js                 # Database seeding
└── uploads/
    ├── pdf/
    ├── slides/
    ├── books/
    └── exams/
```

## Complete Navigation Flow

```
/browse
   │
   ▼
┌─────────────────┐
│   Colleges      │  (College of Computing, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Departments    │  (Software Engineering, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Years       │  (Year 1, 2, 3, 4)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Semesters     │  (Semester 1, 2)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Courses      │  (SE101, SE102, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Chapters      │  (Chapter 1, Chapter 2, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Resources     │  (📄 PDF, 📊 Slide, 📖 Book, 📝 Exam)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  File Delivery  │  (PDF sent to user)
└─────────────────┘
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env`:
```env
BOT_TOKEN=your_bot_token
MONGO_URI=mongodb://127.0.0.1:27017/humsj-library
```

### 3. Seed the Database
```bash
npm run seed
```

### 4. Run the Bot
```bash
npm run dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/browse` | Browse academic resources |
| `/testdb` | Test database connection |

## Testing the Complete Flow (Day 5)

1. Start the bot: `npm run dev`
2. Open Telegram and find your bot
3. Send `/browse`
4. Click: **College of Computing**
5. Click: **Software Engineering**
6. Click: **Year 1**
7. Click: **Semester 1**
8. Click: **SE101 – Fundamentals of Programming**
9. Click: **Chapter 1: Introduction**
10. Click: **📄 Introduction to Programming**
11. Bot delivers the PDF file!

## Resource Types

| Icon | Type | Description |
|------|------|-------------|
| 📄 | pdf | PDF documents |
| 📊 | slide | Presentations |
| 📖 | book | E-books |
| 📝 | exam | Past exams |

## Session Management

User selections are stored in memory:
```javascript
userSession[chatId] = {
  collegeId: "...",
  collegeName: "College of Computing",
  departmentId: "...",
  departmentName: "Software Engineering",
  year: 1,
  semester: 1,
  courseId: "...",
  courseCode: "SE101",
  courseName: "Fundamentals of Programming",
  chapter: "Chapter 1",
  resourceId: "..."
};
```

## Adding Real PDF Files

To test with actual files:

1. Place PDF files in the `uploads/` folder:
   ```
   uploads/pdf/se101_ch1_intro.pdf
   uploads/slides/se101_ch1_slides.pptx
   ```

2. Update the database with correct file paths:
   ```javascript
   // In MongoDB
   {
     courseId: "...",
     chapter: "Chapter 1",
     title: "Introduction to Programming",
     type: "pdf",
     filePath: "uploads/pdf/se101_ch1_intro.pdf"
   }
   ```

3. The bot will automatically detect and send the file!

## Error Handling

The bot handles these scenarios:
- ❌ No colleges found
- ❌ No departments in college
- ❌ No courses for semester
- ❌ No chapters for course
- ❌ No resources in chapter
- ❌ File not found
- ❌ File send failure

## NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `node bot.js` | Production mode |
| `npm run dev` | `nodemon bot.js` | Development mode |
| `npm run seed` | `node scripts/seed.js` | Seed database |

## Development Roadmap

- [x] Day 1: Project setup
- [x] Day 2: MongoDB connection
- [x] Day 3: Database schemas & seeding
- [x] Day 4: Navigation handlers
- [x] Day 5: Resource delivery & PDF sending
- [ ] Week 2: Favorites, search, admin panel

## License

MIT
