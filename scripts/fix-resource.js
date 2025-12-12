/**
 * Fix resource file path for testing AI features
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('../db/schemas/Resource');
const Course = require('../db/schemas/Course');

async function fixResource() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Check if resource with this file exists
  const existing = await Resource.findOne({ 
    filePath: 'uploads/pdf/1765570665847_Lecture_-_1___2_-_Basic_Concepts_in_STQA.pdf' 
  });
  
  if (existing) {
    console.log('Resource already exists:', existing.title);
  } else {
    // Create a new resource with the actual file
    const course = await Course.findOne();
    if (course) {
      const newRes = await Resource.create({
        courseId: course._id,
        chapter: 'Chapter 1',
        title: 'Basic Concepts in STQA',
        type: 'pdf',
        filePath: 'uploads/pdf/1765570665847_Lecture_-_1___2_-_Basic_Concepts_in_STQA.pdf'
      });
      console.log('Created resource:', newRes.title, 'ID:', newRes._id);
    } else {
      console.log('No courses found. Run seed.js first.');
    }
  }
  
  await mongoose.disconnect();
}

fixResource().catch(console.error);
