# HUMSJ Academic Library Bot 📚

A Telegram bot for accessing academic resources including PDFs, slides, books, and past exams.

## Features

- 📂 **Browse** - Navigate by College → Department → Year → Semester → Course
- 🔍 **Search** - Find resources instantly with keywords
- 📄 **PDF Delivery** - Get files directly in Telegram
- 📊 **Multiple Resource Types** - PDFs, Slides, Books, Exams

## Quick Start

```bash
npm install
npm run seed
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/browse` | Browse by college/department |
| `/search <keyword>` | Search all resources |
| `/testdb` | Test database connection |

## Search Examples

```
/search calculus
/search biology
/search accounting
/search psychology
```

## Project Structure

```
humsj-telegram-bot/
├── bot.js                      # Main entry point
├── db/
│   ├── mongoose.js             # MongoDB connection
│   └── schemas/                # Database models
├── handlers/
│   ├── collegeHandler.js       # College browsing
│   ├── departmentHandler.js    # Department selection
│   ├── yearHandler.js          # Year selection
│   ├── semesterHandler.js      # Semester selection
│   ├── courseHandler.js        # Course selection
│   ├── chapterHandler.js       # Chapter selection
│   ├── resourceHandler.js      # File delivery
│   └── searchHandler.js        # Global search
├── utils/
│   └── sessionManager.js       # User state management
├── scripts/
│   └── seed.js                 # Database seeding
└── uploads/                    # Resource files
```

## Navigation Flow

```
/browse
   ↓
Colleges → Departments → Years → Semesters → Courses → Chapters → Resources → PDF
```

## Search Flow

```
/search biology
   ↓
┌─────────────────────────────────┐
│ 🔍 Search results for: "biology"│
│                                 │
│ [📋 All] [📘 Courses] [📄 Files]│
│                                 │
│ 📘 BIO101 – General Biology I   │
│ 📘 BIO102 – General Biology II  │
│ 📑 Chapter 1 (BIO101)           │
│ 📄 Cell Structure.pdf           │
│                                 │
│ [⬅️ Previous] [Next ➡️]         │
└─────────────────────────────────┘
```

## HUMSJ Colleges

- **Behavioral Science** - Psychology, Education
- **Agriculture College** - Plant Sciences, Animal Science
- **Business and Economics** - Accounting, Economics, Management
- **CNCS** - Mathematics, Physics, Chemistry, Biology
- **Social Science** - Sociology, History, Geography

## Environment Setup

Create `.env` file:
```env
BOT_TOKEN=your_bot_token_here
MONGO_URI=mongodb://localhost:27017/humsj-library
NODE_ENV=development
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Production mode |
| `npm run dev` | Development with auto-reload |
| `npm run seed` | Seed database with sample data |

## Development Progress

- [x] Day 1: Project setup
- [x] Day 2: MongoDB connection
- [x] Day 3: Database schemas
- [x] Day 4: Navigation system
- [x] Day 5: Resource delivery
- [x] Day 6: Global search
- [ ] Week 2: Admin panel, favorites

## License

MIT
