/**
 * ================================
 * Database Seed Script
 * ================================
 * 
 * Populates the database with HUMSJ colleges and departments.
 * Run with: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import all schemas
const College = require('../db/schemas/College');
const Department = require('../db/schemas/Department');
const Course = require('../db/schemas/Course');
const Resource = require('../db/schemas/Resource');
const User = require('../db/schemas/User');

// ================================
// Seed Data - HUMSJ Colleges
// ================================

const colleges = [
  { name: 'Behavioral Science', description: 'Education and psychology programs' },
  { name: 'Agriculture College', description: 'Agricultural sciences and rural development' },
  { name: 'Business and Economics College', description: 'Business administration and economics' },
  { name: 'CCI', description: 'College of Computing and Informatics' },
  { name: 'CNCS', description: 'College of Natural and Computational Sciences' },
  { name: 'Law College', description: 'Legal studies and jurisprudence' },
  { name: 'Social Science', description: 'Social sciences and humanities' }
];

const departments = [
  // Behavioral Science
  { collegeName: 'Behavioral Science', name: 'Adult Education and Community Development', description: 'Adult learning and community programs' },
  { collegeName: 'Behavioral Science', name: 'Educational Planning and Management', description: 'Education administration and planning' },
  { collegeName: 'Behavioral Science', name: 'Psychology', description: 'Human behavior and mental processes' },
  { collegeName: 'Behavioral Science', name: 'Special Needs and Inclusive Education', description: 'Inclusive education for all learners' },
  
  // Agriculture College
  { collegeName: 'Agriculture College', name: 'Agricultural Economics and Agribusiness', description: 'Farm economics and business' },
  { collegeName: 'Agriculture College', name: 'Animal and Range Science', description: 'Livestock and rangeland management' },
  { collegeName: 'Agriculture College', name: 'Natural Resources and Environmental Science', description: 'Environmental conservation' },
  { collegeName: 'Agriculture College', name: 'Plant Sciences', description: 'Crop science and horticulture' },
  { collegeName: 'Agriculture College', name: 'Rural Development and Agricultural Innovation', description: 'Rural development programs' },
  
  // Business and Economics College
  { collegeName: 'Business and Economics College', name: 'Accounting and Finance', description: 'Financial accounting and management' },
  { collegeName: 'Business and Economics College', name: 'Cooperatives', description: 'Cooperative business management' },
  { collegeName: 'Business and Economics College', name: 'Economics', description: 'Economic theory and analysis' },
  { collegeName: 'Business and Economics College', name: 'Management', description: 'Business management and leadership' },
  { collegeName: 'Business and Economics College', name: 'Public Administration and Development Management', description: 'Public sector management' },
  
  // CCI (College of Computing and Informatics)
  { collegeName: 'CCI', name: 'Computer Science', description: 'Software development and algorithms' },
  { collegeName: 'CCI', name: 'Information Technology', description: 'IT systems and infrastructure' },
  { collegeName: 'CCI', name: 'Information Systems', description: 'Business information systems' },
  { collegeName: 'CCI', name: 'Information Science', description: 'Information management and retrieval' },
  { collegeName: 'CCI', name: 'Software Engineering', description: 'Software design and development' },
  { collegeName: 'CCI', name: 'Statistics', description: 'Statistical analysis and probability' },
  
  // CNCS (College of Natural and Computational Sciences)
  { collegeName: 'CNCS', name: 'Mathematics', description: 'Pure and applied mathematics' },
  { collegeName: 'CNCS', name: 'Physics', description: 'Physical sciences' },
  { collegeName: 'CNCS', name: 'Chemistry', description: 'Chemical sciences' },
  { collegeName: 'CNCS', name: 'Biology', description: 'Biological sciences' },
  { collegeName: 'CNCS', name: 'Biotechnology', description: 'Applied biological technology' },
  
  // Law College
  { collegeName: 'Law College', name: 'Law', description: 'Legal studies and practice' },
  
  // Social Science
  { collegeName: 'Social Science', name: 'Geography and Environmental Studies', description: 'Geography and environment' },
  { collegeName: 'Social Science', name: 'History and Heritage Management', description: 'Historical studies and heritage' },
  { collegeName: 'Social Science', name: 'Foreign Language Studies', description: 'Foreign languages and literature' },
  { collegeName: 'Social Science', name: 'Afaan Oromoo', description: 'Oromo language and literature' },
  { collegeName: 'Social Science', name: 'Gender and Development Studies', description: 'Gender studies and development' },
  { collegeName: 'Social Science', name: 'Sociology', description: 'Study of society and social behavior' }
];

// Sample courses for some departments
const courses = [
  // Psychology courses
  { deptName: 'Psychology', year: 1, semester: 1, courseCode: 'PSY101', name: 'Introduction to Psychology', description: 'Basic concepts of psychology' },
  { deptName: 'Psychology', year: 1, semester: 2, courseCode: 'PSY102', name: 'Developmental Psychology', description: 'Human development across lifespan' },
  { deptName: 'Psychology', year: 2, semester: 1, courseCode: 'PSY201', name: 'Abnormal Psychology', description: 'Mental disorders and treatments' },
  
  // Accounting and Finance courses
  { deptName: 'Accounting and Finance', year: 1, semester: 1, courseCode: 'ACC101', name: 'Principles of Accounting I', description: 'Basic accounting principles' },
  { deptName: 'Accounting and Finance', year: 1, semester: 2, courseCode: 'ACC102', name: 'Principles of Accounting II', description: 'Advanced accounting principles' },
  { deptName: 'Accounting and Finance', year: 2, semester: 1, courseCode: 'ACC201', name: 'Financial Accounting', description: 'Financial statements and reporting' },
  { deptName: 'Accounting and Finance', year: 2, semester: 2, courseCode: 'ACC202', name: 'Cost Accounting', description: 'Cost analysis and management' },
  
  // Economics courses
  { deptName: 'Economics', year: 1, semester: 1, courseCode: 'ECO101', name: 'Microeconomics', description: 'Individual economic behavior' },
  { deptName: 'Economics', year: 1, semester: 2, courseCode: 'ECO102', name: 'Macroeconomics', description: 'National economic systems' },
  { deptName: 'Economics', year: 2, semester: 1, courseCode: 'ECO201', name: 'Development Economics', description: 'Economic development theory' },
  
  // Computer Science courses
  { deptName: 'Computer Science', year: 1, semester: 1, courseCode: 'CS101', name: 'Introduction to Programming', description: 'Basic programming concepts' },
  { deptName: 'Computer Science', year: 1, semester: 2, courseCode: 'CS102', name: 'Object-Oriented Programming', description: 'OOP concepts and design' },
  { deptName: 'Computer Science', year: 2, semester: 1, courseCode: 'CS201', name: 'Data Structures', description: 'Arrays, lists, trees, graphs' },
  { deptName: 'Computer Science', year: 2, semester: 2, courseCode: 'CS202', name: 'Algorithms', description: 'Algorithm design and analysis' },
  
  // Information Technology courses
  { deptName: 'Information Technology', year: 1, semester: 1, courseCode: 'IT101', name: 'IT Fundamentals', description: 'Basic IT concepts' },
  { deptName: 'Information Technology', year: 1, semester: 2, courseCode: 'IT102', name: 'Networking Basics', description: 'Computer networks introduction' },
  { deptName: 'Information Technology', year: 2, semester: 1, courseCode: 'IT201', name: 'Database Systems', description: 'Database design and SQL' },
  
  // Software Engineering courses
  { deptName: 'Software Engineering', year: 1, semester: 1, courseCode: 'SE101', name: 'Software Engineering Principles', description: 'SE fundamentals' },
  { deptName: 'Software Engineering', year: 2, semester: 1, courseCode: 'SE201', name: 'Software Design', description: 'Design patterns and architecture' },
  
  // Information Science courses
  { deptName: 'Information Science', year: 1, semester: 1, courseCode: 'INS101', name: 'Introduction to Information Science', description: 'Fundamentals of information science' },
  { deptName: 'Information Science', year: 1, semester: 2, courseCode: 'INS102', name: 'Information Organization', description: 'Organizing and classifying information' },
  { deptName: 'Information Science', year: 2, semester: 1, courseCode: 'INS201', name: 'Information Retrieval', description: 'Search and retrieval systems' },
  
  // Mathematics courses
  { deptName: 'Mathematics', year: 1, semester: 1, courseCode: 'MAT101', name: 'Calculus I', description: 'Differential calculus' },
  { deptName: 'Mathematics', year: 1, semester: 2, courseCode: 'MAT102', name: 'Calculus II', description: 'Integral calculus' },
  { deptName: 'Mathematics', year: 2, semester: 1, courseCode: 'MAT201', name: 'Linear Algebra', description: 'Vectors and matrices' },
  { deptName: 'Mathematics', year: 2, semester: 2, courseCode: 'MAT202', name: 'Differential Equations', description: 'Ordinary differential equations' },
  
  // Statistics courses
  { deptName: 'Statistics', year: 1, semester: 1, courseCode: 'STA101', name: 'Introduction to Statistics', description: 'Basic statistical concepts' },
  { deptName: 'Statistics', year: 1, semester: 2, courseCode: 'STA102', name: 'Probability Theory', description: 'Probability and distributions' },
  { deptName: 'Statistics', year: 2, semester: 1, courseCode: 'STA201', name: 'Statistical Inference', description: 'Hypothesis testing and estimation' },
  
  // Physics courses
  { deptName: 'Physics', year: 1, semester: 1, courseCode: 'PHY101', name: 'General Physics I', description: 'Mechanics and thermodynamics' },
  { deptName: 'Physics', year: 1, semester: 2, courseCode: 'PHY102', name: 'General Physics II', description: 'Electricity and magnetism' },
  
  // Chemistry courses
  { deptName: 'Chemistry', year: 1, semester: 1, courseCode: 'CHE101', name: 'General Chemistry I', description: 'Basic chemistry concepts' },
  { deptName: 'Chemistry', year: 1, semester: 2, courseCode: 'CHE102', name: 'General Chemistry II', description: 'Advanced chemistry concepts' },
  
  // Biology courses
  { deptName: 'Biology', year: 1, semester: 1, courseCode: 'BIO101', name: 'General Biology I', description: 'Cell biology and genetics' },
  { deptName: 'Biology', year: 1, semester: 2, courseCode: 'BIO102', name: 'General Biology II', description: 'Ecology and evolution' },
  
  // Plant Sciences courses
  { deptName: 'Plant Sciences', year: 1, semester: 1, courseCode: 'PLS101', name: 'Introduction to Plant Science', description: 'Basic plant biology' },
  { deptName: 'Plant Sciences', year: 2, semester: 1, courseCode: 'PLS201', name: 'Crop Production', description: 'Crop cultivation techniques' },
  
  // Sociology courses
  { deptName: 'Sociology', year: 1, semester: 1, courseCode: 'SOC101', name: 'Introduction to Sociology', description: 'Basic sociological concepts' },
  { deptName: 'Sociology', year: 1, semester: 2, courseCode: 'SOC102', name: 'Social Problems', description: 'Contemporary social issues' },
  
  // History courses
  { deptName: 'History and Heritage Management', year: 1, semester: 1, courseCode: 'HIS101', name: 'World History', description: 'Global historical events' },
  { deptName: 'History and Heritage Management', year: 1, semester: 2, courseCode: 'HIS102', name: 'Ethiopian History', description: 'History of Ethiopia' },
  
  // Law courses
  { deptName: 'Law', year: 1, semester: 1, courseCode: 'LAW101', name: 'Introduction to Law', description: 'Basic legal concepts and principles' },
  { deptName: 'Law', year: 1, semester: 2, courseCode: 'LAW102', name: 'Constitutional Law', description: 'Constitutional principles and rights' },
  { deptName: 'Law', year: 2, semester: 1, courseCode: 'LAW201', name: 'Criminal Law', description: 'Criminal justice and procedures' },
  { deptName: 'Law', year: 2, semester: 2, courseCode: 'LAW202', name: 'Contract Law', description: 'Contract formation and enforcement' }
];

// Sample resources
const resources = [
  // Psychology resources
  { courseCode: 'PSY101', chapter: 'Chapter 1', title: 'Introduction to Psychology', type: 'pdf', filePath: 'uploads/pdf/psy101_ch1.pdf' },
  { courseCode: 'PSY101', chapter: 'Chapter 2', title: 'Research Methods', type: 'pdf', filePath: 'uploads/pdf/psy101_ch2.pdf' },
  { courseCode: 'PSY101', chapter: 'Midterm', title: 'Midterm Exam 2024', type: 'exam', filePath: 'uploads/exams/psy101_midterm.pdf' },
  
  // Accounting resources
  { courseCode: 'ACC101', chapter: 'Chapter 1', title: 'Accounting Basics', type: 'pdf', filePath: 'uploads/pdf/acc101_ch1.pdf' },
  { courseCode: 'ACC101', chapter: 'Chapter 1', title: 'Accounting Slides', type: 'slide', filePath: 'uploads/slides/acc101_ch1.pptx' },
  { courseCode: 'ACC101', chapter: 'Chapter 2', title: 'Journal Entries', type: 'pdf', filePath: 'uploads/pdf/acc101_ch2.pdf' },
  
  // Mathematics resources
  { courseCode: 'MAT101', chapter: 'Chapter 1', title: 'Limits and Continuity', type: 'pdf', filePath: 'uploads/pdf/mat101_ch1.pdf' },
  { courseCode: 'MAT101', chapter: 'Chapter 2', title: 'Derivatives', type: 'pdf', filePath: 'uploads/pdf/mat101_ch2.pdf' },
  { courseCode: 'MAT101', chapter: 'Chapter 2', title: 'Derivatives Slides', type: 'slide', filePath: 'uploads/slides/mat101_ch2.pptx' },
  { courseCode: 'MAT101', chapter: 'Final', title: 'Final Exam 2023', type: 'exam', filePath: 'uploads/exams/mat101_final.pdf' },
  
  // Physics resources
  { courseCode: 'PHY101', chapter: 'Chapter 1', title: 'Mechanics Introduction', type: 'pdf', filePath: 'uploads/pdf/phy101_ch1.pdf' },
  { courseCode: 'PHY101', chapter: 'Chapter 2', title: 'Newton Laws', type: 'pdf', filePath: 'uploads/pdf/phy101_ch2.pdf' },
  
  // Biology resources
  { courseCode: 'BIO101', chapter: 'Chapter 1', title: 'Cell Structure', type: 'pdf', filePath: 'uploads/pdf/bio101_ch1.pdf' },
  { courseCode: 'BIO101', chapter: 'Chapter 1', title: 'Cell Biology Slides', type: 'slide', filePath: 'uploads/slides/bio101_ch1.pptx' },
  
  // Sociology resources
  { courseCode: 'SOC101', chapter: 'Chapter 1', title: 'What is Sociology', type: 'pdf', filePath: 'uploads/pdf/soc101_ch1.pdf' },
  { courseCode: 'SOC101', chapter: 'Midterm', title: 'Midterm Exam 2024', type: 'exam', filePath: 'uploads/exams/soc101_midterm.pdf' }
];

// ================================
// Seed Function
// ================================

async function seed() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await Promise.all([
      College.deleteMany({}),
      Department.deleteMany({}),
      Course.deleteMany({}),
      Resource.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('✅ Database cleaned');

    // Insert colleges
    console.log('📚 Inserting colleges...');
    const insertedColleges = await College.insertMany(colleges);
    console.log(`   ✅ Inserted ${insertedColleges.length} colleges`);

    // Create college name to ID map
    const collegeMap = {};
    insertedColleges.forEach(c => collegeMap[c.name] = c._id);

    // Insert departments with college references
    console.log('🏛️  Inserting departments...');
    const deptData = departments.map(d => ({
      collegeId: collegeMap[d.collegeName],
      name: d.name,
      description: d.description
    }));
    const insertedDepts = await Department.insertMany(deptData);
    console.log(`   ✅ Inserted ${insertedDepts.length} departments`);

    // Create department name to ID map
    const deptMap = {};
    insertedDepts.forEach(d => deptMap[d.name] = d._id);

    // Insert courses with department references
    console.log('📖 Inserting courses...');
    const courseData = courses.map(c => ({
      departmentId: deptMap[c.deptName],
      year: c.year,
      semester: c.semester,
      courseCode: c.courseCode,
      name: c.name,
      description: c.description
    }));
    const insertedCourses = await Course.insertMany(courseData);
    console.log(`   ✅ Inserted ${insertedCourses.length} courses`);

    // Create course code to ID map
    const courseMap = {};
    insertedCourses.forEach(c => courseMap[c.courseCode] = c._id);

    // Insert resources with course references
    console.log('📄 Inserting resources...');
    const resourceData = resources.map(r => ({
      courseId: courseMap[r.courseCode],
      chapter: r.chapter,
      title: r.title,
      type: r.type,
      filePath: r.filePath
    }));
    const insertedResources = await Resource.insertMany(resourceData);
    console.log(`   ✅ Inserted ${insertedResources.length} resources`);

    // Summary
    console.log('\n========================================');
    console.log('🎉 Seeding completed successfully!');
    console.log('========================================');
    console.log(`   Colleges:    ${insertedColleges.length}`);
    console.log(`   Departments: ${insertedDepts.length}`);
    console.log(`   Courses:     ${insertedCourses.length}`);
    console.log(`   Resources:   ${insertedResources.length}`);
    console.log('========================================');
    console.log('\n📋 Colleges added:');
    insertedColleges.forEach(c => console.log(`   • ${c.name}`));
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run seed
seed();
