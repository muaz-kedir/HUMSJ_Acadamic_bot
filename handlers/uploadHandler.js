/**
 * ================================
 * Upload Handler - Admin Panel
 * ================================
 * 
 * Complete admin upload system with cascading dropdowns:
 * College → Department → Year → Semester → Course
 */

const { Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const College = require('../db/schemas/College');
const Department = require('../db/schemas/Department');
const Course = require('../db/schemas/Course');
const Resource = require('../db/schemas/Resource');
const { log } = require('../utils/logger');
const {
  EMOJI,
  ERRORS,
  NAV,
  showTyping,
  safeEditMessage,
  safeAnswerCallback
} = require('../utils/branding');

// Upload sessions storage
const uploadSessions = new Map();

/**
 * Check if user is admin
 */
function isAdmin(userId) {
  const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];
  log.info('Admin check', { userId: userId.toString(), adminIds, isAdmin: adminIds.includes(userId.toString()) });
  return adminIds.includes(userId.toString());
}

/**
 * Get or create upload session
 */
function getUploadSession(chatId) {
  if (!uploadSessions.has(chatId)) {
    uploadSessions.set(chatId, {
      step: null,
      collegeId: null,
      collegeName: null,
      departmentId: null,
      departmentName: null,
      year: null,
      semester: null,
      courseId: null,
      courseName: null,
      chapter: null,
      title: null,
      type: null,
      awaitingFile: false,
      awaitingTitle: false,
      awaitingChapter: false,
      awaitingCourseCode: false,
      awaitingCourseName: false
    });
  }
  return uploadSessions.get(chatId);
}

/**
 * Clear upload session
 */
function clearUploadSession(chatId) {
  uploadSessions.delete(chatId);
}

// ================================
// ADMIN PANEL MAIN MENU
// ================================

/**
 * Handle /admin command - Show admin panel
 */
async function handleAdminPanel(ctx) {
  try {
    const userId = ctx.from.id.toString();
    
    if (!isAdmin(userId)) {
      return ctx.reply(`${EMOJI.error} Admin access required.`);
    }
    
    clearUploadSession(ctx.chat.id);
    
    const buttons = [
      [Markup.button.callback('📤 Upload Resource', 'admin_upload_start')],
      [Markup.button.callback('➕ Add New Course', 'admin_add_course')],
      [Markup.button.callback('📋 Manage Courses', 'admin_manage_courses')],
      [Markup.button.callback('📊 View Statistics', 'admin_stats')],
      [Markup.button.callback(NAV.home, 'go_home')]
    ];
    
    const message = `🔧 *Admin Panel*\n\n` +
      `Welcome to the HUMSJ Library Admin Panel.\n\n` +
      `*Available Actions:*\n` +
      `${EMOJI.bullet} Upload new resources\n` +
      `${EMOJI.bullet} Add new courses\n` +
      `${EMOJI.bullet} Manage existing courses\n` +
      `${EMOJI.bullet} View statistics`;
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
  } catch (error) {
    log.error('Admin panel error', { error: error.message });
    await ctx.reply(ERRORS.general);
  }
}

// ================================
// UPLOAD RESOURCE FLOW
// ================================

/**
 * Start upload flow - Select College
 */
async function handleUploadStart(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    if (!isAdmin(ctx.from.id.toString())) {
      return ctx.reply(`${EMOJI.error} Admin access required.`);
    }
    
    await showTyping(ctx);
    
    const session = getUploadSession(ctx.chat.id);
    session.step = 'select_college';
    
    const colleges = await College.find({}).sort({ name: 1 });
    
    if (colleges.length === 0) {
      return ctx.reply('No colleges found. Please seed the database first.');
    }
    
    const buttons = colleges.map(c => [
      Markup.button.callback(`${EMOJI.college} ${c.name}`, `upload_college_${c._id}`)
    ]);
    buttons.push([Markup.button.callback('❌ Cancel', 'admin_cancel')]);
    
    await safeEditMessage(ctx,
      `📤 *Upload Resource*\n\n` +
      `*Step 1/6:* Select College\n\n` +
      `Choose the college for this resource:`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    log.error('Upload start error', { error: error.message });
    await ctx.reply(ERRORS.general);
  }
}

/**
 * Handle college selection for upload
 */
async function handleUploadCollegeSelect(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const collegeId = ctx.callbackQuery.data.replace('upload_college_', '');
    const college = await College.findById(collegeId);
    
    if (!college) return ctx.reply(ERRORS.notFound);
    
    const session = getUploadSession(ctx.chat.id);
    session.collegeId = college._id;
    session.collegeName = college.name;
    session.step = 'select_department';
    
    await showTyping(ctx);
    
    const departments = await Department.find({ collegeId: college._id }).sort({ name: 1 });
    
    if (departments.length === 0) {
      return safeEditMessage(ctx,
        `${EMOJI.warning} No departments found in ${college.name}.`,
        { parse_mode: 'Markdown' }
      );
    }
    
    const buttons = departments.map(d => [
      Markup.button.callback(`${EMOJI.department} ${d.name}`, `upload_dept_${d._id}`)
    ]);
    buttons.push([Markup.button.callback('🔙 Back', 'admin_upload_start')]);
    buttons.push([Markup.button.callback('❌ Cancel', 'admin_cancel')]);
    
    await safeEditMessage(ctx,
      `📤 *Upload Resource*\n\n` +
      `${EMOJI.college} College: *${college.name}*\n\n` +
      `*Step 2/6:* Select Department`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    log.error('Upload college select error', { error: error.message });
  }
}

/**
 * Handle department selection for upload
 */
async function handleUploadDeptSelect(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const deptId = ctx.callbackQuery.data.replace('upload_dept_', '');
    const dept = await Department.findById(deptId);
    
    if (!dept) return ctx.reply(ERRORS.notFound);
    
    const session = getUploadSession(ctx.chat.id);
    session.departmentId = dept._id;
    session.departmentName = dept.name;
    session.step = 'select_year';
    
    const buttons = [
      [
        Markup.button.callback('📅 Year 1', 'upload_year_1'),
        Markup.button.callback('📅 Year 2', 'upload_year_2')
      ],
      [
        Markup.button.callback('📅 Year 3', 'upload_year_3'),
        Markup.button.callback('📅 Year 4', 'upload_year_4')
      ],
      [Markup.button.callback('🔙 Back', `upload_college_${session.collegeId}`)],
      [Markup.button.callback('❌ Cancel', 'admin_cancel')]
    ];
    
    await safeEditMessage(ctx,
      `📤 *Upload Resource*\n\n` +
      `${EMOJI.college} College: *${session.collegeName}*\n` +
      `${EMOJI.department} Department: *${dept.name}*\n\n` +
      `*Step 3/6:* Select Year`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    log.error('Upload dept select error', { error: error.message });
  }
}

/**
 * Handle year selection for upload
 */
async function handleUploadYearSelect(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const year = parseInt(ctx.callbackQuery.data.replace('upload_year_', ''));
    
    const session = getUploadSession(ctx.chat.id);
    session.year = year;
    session.step = 'select_semester';
    
    const buttons = [
      [
        Markup.button.callback('📘 Semester 1', 'upload_sem_1'),
        Markup.button.callback('📗 Semester 2', 'upload_sem_2')
      ],
      [Markup.button.callback('🔙 Back', `upload_dept_${session.departmentId}`)],
      [Markup.button.callback('❌ Cancel', 'admin_cancel')]
    ];
    
    await safeEditMessage(ctx,
      `📤 *Upload Resource*\n\n` +
      `${EMOJI.college} College: *${session.collegeName}*\n` +
      `${EMOJI.department} Department: *${session.departmentName}*\n` +
      `${EMOJI.year} Year: *${year}*\n\n` +
      `*Step 4/6:* Select Semester`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    log.error('Upload year select error', { error: error.message });
  }
}


/**
 * Handle semester selection - Show courses
 */
async function handleUploadSemSelect(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const semester = parseInt(ctx.callbackQuery.data.replace('upload_sem_', ''));
    
    const session = getUploadSession(ctx.chat.id);
    session.semester = semester;
    session.step = 'select_course';
    
    await showTyping(ctx);
    
    // Fetch courses for this department, year, semester
    const courses = await Course.find({
      departmentId: session.departmentId,
      year: session.year,
      semester: semester
    }).sort({ courseCode: 1 });
    
    const buttons = [];
    
    if (courses.length > 0) {
      courses.forEach(c => {
        buttons.push([
          Markup.button.callback(`${EMOJI.course} ${c.courseCode} - ${c.name}`, `upload_course_${c._id}`)
        ]);
      });
    }
    
    // Always show option to add new course
    buttons.push([Markup.button.callback('➕ Add New Course', 'upload_new_course')]);
    buttons.push([Markup.button.callback('🔙 Back', `upload_year_${session.year}`)]);
    buttons.push([Markup.button.callback('❌ Cancel', 'admin_cancel')]);
    
    const courseCount = courses.length > 0 ? `Found ${courses.length} course(s)` : 'No courses found';
    
    await safeEditMessage(ctx,
      `📤 *Upload Resource*\n\n` +
      `${EMOJI.college} College: *${session.collegeName}*\n` +
      `${EMOJI.department} Department: *${session.departmentName}*\n` +
      `${EMOJI.year} Year: *${session.year}*\n` +
      `${EMOJI.semester} Semester: *${semester}*\n\n` +
      `*Step 5/6:* Select Course\n` +
      `_${courseCount}_`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    log.error('Upload sem select error', { error: error.message });
  }
}

/**
 * Handle course selection - Ask for chapter/title
 */
async function handleUploadCourseSelect(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const courseId = ctx.callbackQuery.data.replace('upload_course_', '');
    const course = await Course.findById(courseId);
    
    if (!course) return ctx.reply(ERRORS.notFound);
    
    const session = getUploadSession(ctx.chat.id);
    session.courseId = course._id;
    session.courseName = `${course.courseCode} - ${course.name}`;
    session.step = 'enter_chapter';
    session.awaitingChapter = true;
    
    await safeEditMessage(ctx,
      `📤 *Upload Resource*\n\n` +
      `${EMOJI.college} College: *${session.collegeName}*\n` +
      `${EMOJI.department} Department: *${session.departmentName}*\n` +
      `${EMOJI.year} Year: *${session.year}*\n` +
      `${EMOJI.semester} Semester: *${session.semester}*\n` +
      `${EMOJI.course} Course: *${session.courseName}*\n\n` +
      `*Step 6/6:* Enter Chapter Name\n\n` +
      `Please type the chapter name (e.g., "Chapter 1", "Midterm", "Final"):`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancel', 'admin_cancel')]
      ]) }
    );
    
  } catch (error) {
    log.error('Upload course select error', { error: error.message });
  }
}

/**
 * Handle text input during upload flow
 */
async function handleUploadTextInput(ctx) {
  const session = getUploadSession(ctx.chat.id);
  const text = ctx.message.text.trim();
  
  if (!session.step) return false;
  
  // Handle chapter input
  if (session.awaitingChapter) {
    session.chapter = text;
    session.awaitingChapter = false;
    session.awaitingTitle = true;
    
    await ctx.reply(
      `${EMOJI.success} Chapter: *${text}*\n\n` +
      `Now enter the resource title:`,
      { parse_mode: 'Markdown' }
    );
    return true;
  }
  
  // Handle title input
  if (session.awaitingTitle) {
    session.title = text;
    session.awaitingTitle = false;
    
    const buttons = [
      [
        Markup.button.callback('📄 PDF', 'upload_type_pdf'),
        Markup.button.callback('📊 Slide', 'upload_type_slide')
      ],
      [
        Markup.button.callback('📖 Book', 'upload_type_book'),
        Markup.button.callback('📝 Exam', 'upload_type_exam')
      ],
      [Markup.button.callback('❌ Cancel', 'admin_cancel')]
    ];
    
    await ctx.reply(
      `${EMOJI.success} Title: *${text}*\n\n` +
      `Select the resource type:`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    return true;
  }
  
  // Handle new course code input
  if (session.awaitingCourseCode) {
    session.newCourseCode = text.toUpperCase();
    session.awaitingCourseCode = false;
    session.awaitingCourseName = true;
    
    await ctx.reply(
      `${EMOJI.success} Course Code: *${session.newCourseCode}*\n\n` +
      `Now enter the course name:`,
      { parse_mode: 'Markdown' }
    );
    return true;
  }
  
  // Handle new course name input
  if (session.awaitingCourseName) {
    session.newCourseName = text;
    session.awaitingCourseName = false;
    
    // Create the new course
    try {
      const newCourse = await Course.create({
        departmentId: session.departmentId,
        year: session.year,
        semester: session.semester,
        courseCode: session.newCourseCode,
        name: session.newCourseName
      });
      
      session.courseId = newCourse._id;
      session.courseName = `${newCourse.courseCode} - ${newCourse.name}`;
      session.awaitingChapter = true;
      
      await ctx.reply(
        `${EMOJI.success} *Course Created Successfully!*\n\n` +
        `${EMOJI.course} ${session.courseName}\n\n` +
        `Now enter the chapter name for the resource:`,
        { parse_mode: 'Markdown' }
      );
      
      log.info('New course created', { courseId: newCourse._id.toString(), code: newCourse.courseCode });
      
    } catch (error) {
      if (error.code === 11000) {
        await ctx.reply(`${EMOJI.warning} A course with this code already exists. Please use a different code.`);
        session.awaitingCourseCode = true;
      } else {
        await ctx.reply(`${EMOJI.error} Failed to create course: ${error.message}`);
      }
    }
    return true;
  }
  
  return false;
}

/**
 * Handle resource type selection
 */
async function handleUploadTypeSelect(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const type = ctx.callbackQuery.data.replace('upload_type_', '');
    
    const session = getUploadSession(ctx.chat.id);
    session.type = type;
    session.awaitingFile = true;
    
    await ctx.reply(
      `📤 *Ready to Upload*\n\n` +
      `${EMOJI.college} College: *${session.collegeName}*\n` +
      `${EMOJI.department} Department: *${session.departmentName}*\n` +
      `${EMOJI.year} Year: *${session.year}*\n` +
      `${EMOJI.semester} Semester: *${session.semester}*\n` +
      `${EMOJI.course} Course: *${session.courseName}*\n` +
      `${EMOJI.chapter} Chapter: *${session.chapter}*\n` +
      `📄 Title: *${session.title}*\n` +
      `📁 Type: *${type}*\n\n` +
      `*Now send the file* (PDF, DOC, or any document):`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancel', 'admin_cancel')]
      ]) }
    );
    
  } catch (error) {
    log.error('Upload type select error', { error: error.message });
  }
}


/**
 * Handle file upload
 */
async function handleFileUpload(ctx) {
  const session = getUploadSession(ctx.chat.id);
  
  if (!session.awaitingFile) return false;
  
  try {
    const document = ctx.message.document;
    
    if (!document) {
      await ctx.reply(`${EMOJI.warning} Please send a document file.`);
      return true;
    }
    
    await ctx.reply(`${EMOJI.loading} Uploading file...`);
    
    // Get file info
    const fileId = document.file_id;
    const fileName = document.file_name || 'resource.pdf';
    const fileSize = document.file_size || 0;
    
    // Create uploads directory if not exists
    const uploadDir = path.join(process.cwd(), 'uploads', session.type || 'pdf');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Download file
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await axios({
      method: 'GET',
      url: fileLink.href,
      responseType: 'arraybuffer'
    });
    
    // Save file
    const safeFileName = `${Date.now()}_${fileName.replace(/[^a-z0-9._-]/gi, '_')}`;
    const filePath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(filePath, response.data);
    
    // Create resource in database
    const resource = await Resource.create({
      courseId: session.courseId,
      chapter: session.chapter,
      title: session.title,
      type: session.type,
      filePath: `uploads/${session.type}/${safeFileName}`,
      fileSize: fileSize
    });
    
    // Clear session
    clearUploadSession(ctx.chat.id);
    
    await ctx.reply(
      `${EMOJI.success} *Resource Uploaded Successfully!*\n\n` +
      `📄 Title: ${session.title}\n` +
      `${EMOJI.chapter} Chapter: ${session.chapter}\n` +
      `${EMOJI.course} Course: ${session.courseName}\n` +
      `📁 Type: ${session.type}\n` +
      `💾 Size: ${(fileSize / 1024).toFixed(1)} KB\n\n` +
      `_Resource ID: ${resource._id}_`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📤 Upload Another', 'admin_upload_start')],
          [Markup.button.callback('🔧 Admin Panel', 'admin_panel')],
          [Markup.button.callback(NAV.home, 'go_home')]
        ])
      }
    );
    
    log.info('Resource uploaded', {
      resourceId: resource._id.toString(),
      title: session.title,
      course: session.courseName
    });
    
    return true;
    
  } catch (error) {
    log.error('File upload error', { error: error.message });
    await ctx.reply(`${EMOJI.error} Upload failed: ${error.message}`);
    return true;
  }
}

// ================================
// ADD NEW COURSE FLOW
// ================================

/**
 * Start add course flow
 */
async function handleAddCourseStart(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    if (!isAdmin(ctx.from.id.toString())) {
      return ctx.reply(`${EMOJI.error} Admin access required.`);
    }
    
    const session = getUploadSession(ctx.chat.id);
    session.step = 'add_course_college';
    
    const colleges = await College.find({}).sort({ name: 1 });
    
    const buttons = colleges.map(c => [
      Markup.button.callback(`${EMOJI.college} ${c.name}`, `addcourse_college_${c._id}`)
    ]);
    buttons.push([Markup.button.callback('❌ Cancel', 'admin_cancel')]);
    
    await safeEditMessage(ctx,
      `➕ *Add New Course*\n\n` +
      `*Step 1/5:* Select College`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    log.error('Add course start error', { error: error.message });
  }
}

/**
 * Handle college selection for new course
 */
async function handleAddCourseCollegeSelect(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const collegeId = ctx.callbackQuery.data.replace('addcourse_college_', '');
    const college = await College.findById(collegeId);
    
    if (!college) return ctx.reply(ERRORS.notFound);
    
    const session = getUploadSession(ctx.chat.id);
    session.collegeId = college._id;
    session.collegeName = college.name;
    
    const departments = await Department.find({ collegeId: college._id }).sort({ name: 1 });
    
    const buttons = departments.map(d => [
      Markup.button.callback(`${EMOJI.department} ${d.name}`, `addcourse_dept_${d._id}`)
    ]);
    buttons.push([Markup.button.callback('🔙 Back', 'admin_add_course')]);
    buttons.push([Markup.button.callback('❌ Cancel', 'admin_cancel')]);
    
    await safeEditMessage(ctx,
      `➕ *Add New Course*\n\n` +
      `${EMOJI.college} College: *${college.name}*\n\n` +
      `*Step 2/5:* Select Department`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    log.error('Add course college select error', { error: error.message });
  }
}

/**
 * Handle department selection for new course
 */
async function handleAddCourseDeptSelect(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const deptId = ctx.callbackQuery.data.replace('addcourse_dept_', '');
    const dept = await Department.findById(deptId);
    
    if (!dept) return ctx.reply(ERRORS.notFound);
    
    const session = getUploadSession(ctx.chat.id);
    session.departmentId = dept._id;
    session.departmentName = dept.name;
    
    const buttons = [
      [
        Markup.button.callback('📅 Year 1', 'addcourse_year_1'),
        Markup.button.callback('📅 Year 2', 'addcourse_year_2')
      ],
      [
        Markup.button.callback('📅 Year 3', 'addcourse_year_3'),
        Markup.button.callback('📅 Year 4', 'addcourse_year_4')
      ],
      [Markup.button.callback('🔙 Back', `addcourse_college_${session.collegeId}`)],
      [Markup.button.callback('❌ Cancel', 'admin_cancel')]
    ];
    
    await safeEditMessage(ctx,
      `➕ *Add New Course*\n\n` +
      `${EMOJI.college} College: *${session.collegeName}*\n` +
      `${EMOJI.department} Department: *${dept.name}*\n\n` +
      `*Step 3/5:* Select Year`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    log.error('Add course dept select error', { error: error.message });
  }
}

/**
 * Handle year selection for new course
 */
async function handleAddCourseYearSelect(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const year = parseInt(ctx.callbackQuery.data.replace('addcourse_year_', ''));
    
    const session = getUploadSession(ctx.chat.id);
    session.year = year;
    
    const buttons = [
      [
        Markup.button.callback('📘 Semester 1', 'addcourse_sem_1'),
        Markup.button.callback('📗 Semester 2', 'addcourse_sem_2')
      ],
      [Markup.button.callback('🔙 Back', `addcourse_dept_${session.departmentId}`)],
      [Markup.button.callback('❌ Cancel', 'admin_cancel')]
    ];
    
    await safeEditMessage(ctx,
      `➕ *Add New Course*\n\n` +
      `${EMOJI.college} College: *${session.collegeName}*\n` +
      `${EMOJI.department} Department: *${session.departmentName}*\n` +
      `${EMOJI.year} Year: *${year}*\n\n` +
      `*Step 4/5:* Select Semester`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    log.error('Add course year select error', { error: error.message });
  }
}

/**
 * Handle semester selection - Ask for course code
 */
async function handleAddCourseSemSelect(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const semester = parseInt(ctx.callbackQuery.data.replace('addcourse_sem_', ''));
    
    const session = getUploadSession(ctx.chat.id);
    session.semester = semester;
    session.awaitingCourseCode = true;
    
    await safeEditMessage(ctx,
      `➕ *Add New Course*\n\n` +
      `${EMOJI.college} College: *${session.collegeName}*\n` +
      `${EMOJI.department} Department: *${session.departmentName}*\n` +
      `${EMOJI.year} Year: *${session.year}*\n` +
      `${EMOJI.semester} Semester: *${semester}*\n\n` +
      `*Step 5/5:* Enter Course Code\n\n` +
      `Please type the course code (e.g., CS101, NUR201):`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancel', 'admin_cancel')]
      ]) }
    );
    
  } catch (error) {
    log.error('Add course sem select error', { error: error.message });
  }
}


// ================================
// MANAGE COURSES
// ================================

/**
 * Show course management menu
 */
async function handleManageCourses(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    if (!isAdmin(ctx.from.id.toString())) {
      return ctx.reply(`${EMOJI.error} Admin access required.`);
    }
    
    await showTyping(ctx);
    
    // Get course counts by college
    const colleges = await College.find({}).sort({ name: 1 });
    
    let message = `📋 *Course Management*\n\n`;
    
    for (const college of colleges) {
      const depts = await Department.find({ collegeId: college._id });
      const deptIds = depts.map(d => d._id);
      const courseCount = await Course.countDocuments({ departmentId: { $in: deptIds } });
      message += `${EMOJI.college} *${college.name}*: ${courseCount} courses\n`;
    }
    
    const totalCourses = await Course.countDocuments();
    const totalResources = await Resource.countDocuments();
    
    message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📚 Total Courses: ${totalCourses}\n`;
    message += `📄 Total Resources: ${totalResources}`;
    
    const buttons = [
      [Markup.button.callback('📋 List All Courses', 'admin_list_courses')],
      [Markup.button.callback('➕ Add New Course', 'admin_add_course')],
      [Markup.button.callback('🔙 Back', 'admin_panel')],
      [Markup.button.callback(NAV.home, 'go_home')]
    ];
    
    await safeEditMessage(ctx, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
    
  } catch (error) {
    log.error('Manage courses error', { error: error.message });
  }
}

/**
 * List all courses
 */
async function handleListCourses(ctx) {
  try {
    await safeAnswerCallback(ctx);
    await showTyping(ctx);
    
    const courses = await Course.find({})
      .populate({
        path: 'departmentId',
        populate: { path: 'collegeId' }
      })
      .sort({ courseCode: 1 })
      .limit(50);
    
    if (courses.length === 0) {
      return safeEditMessage(ctx,
        `📋 *All Courses*\n\n${EMOJI.empty} No courses found.`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
          [Markup.button.callback('➕ Add Course', 'admin_add_course')],
          [Markup.button.callback('🔙 Back', 'admin_manage_courses')]
        ]) }
      );
    }
    
    let message = `📋 *All Courses* (${courses.length})\n\n`;
    
    courses.forEach((c, i) => {
      const collegeName = c.departmentId?.collegeId?.name || 'Unknown';
      const deptName = c.departmentId?.name || 'Unknown';
      message += `${i + 1}. *${c.courseCode}* - ${c.name}\n`;
      message += `   _${collegeName} > ${deptName} > Y${c.year}S${c.semester}_\n\n`;
    });
    
    if (message.length > 4000) {
      message = message.substring(0, 3900) + '\n\n_...and more_';
    }
    
    await safeEditMessage(ctx, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('➕ Add Course', 'admin_add_course')],
        [Markup.button.callback('🔙 Back', 'admin_manage_courses')]
      ])
    });
    
  } catch (error) {
    log.error('List courses error', { error: error.message });
  }
}

/**
 * Handle new course creation from upload flow
 */
async function handleUploadNewCourse(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    const session = getUploadSession(ctx.chat.id);
    session.awaitingCourseCode = true;
    
    await ctx.reply(
      `➕ *Add New Course*\n\n` +
      `${EMOJI.college} College: *${session.collegeName}*\n` +
      `${EMOJI.department} Department: *${session.departmentName}*\n` +
      `${EMOJI.year} Year: *${session.year}*\n` +
      `${EMOJI.semester} Semester: *${session.semester}*\n\n` +
      `Please enter the course code (e.g., CS101, NUR201):`,
      { parse_mode: 'Markdown' }
    );
    
  } catch (error) {
    log.error('Upload new course error', { error: error.message });
  }
}

/**
 * Cancel admin operation
 */
async function handleAdminCancel(ctx) {
  try {
    await safeAnswerCallback(ctx);
    clearUploadSession(ctx.chat.id);
    
    await safeEditMessage(ctx,
      `${EMOJI.success} Operation cancelled.`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
        [Markup.button.callback('🔧 Admin Panel', 'admin_panel')],
        [Markup.button.callback(NAV.home, 'go_home')]
      ]) }
    );
    
  } catch (error) {
    log.error('Admin cancel error', { error: error.message });
  }
}

/**
 * Handle admin panel callback
 */
async function handleAdminPanelCallback(ctx) {
  try {
    await safeAnswerCallback(ctx);
    
    if (!isAdmin(ctx.from.id.toString())) {
      return ctx.reply(`${EMOJI.error} Admin access required.`);
    }
    
    clearUploadSession(ctx.chat.id);
    
    const buttons = [
      [Markup.button.callback('📤 Upload Resource', 'admin_upload_start')],
      [Markup.button.callback('➕ Add New Course', 'admin_add_course')],
      [Markup.button.callback('📋 Manage Courses', 'admin_manage_courses')],
      [Markup.button.callback('📊 View Statistics', 'admin_stats')],
      [Markup.button.callback(NAV.home, 'go_home')]
    ];
    
    await safeEditMessage(ctx,
      `🔧 *Admin Panel*\n\n` +
      `Welcome to the HUMSJ Library Admin Panel.\n\n` +
      `*Available Actions:*\n` +
      `${EMOJI.bullet} Upload new resources\n` +
      `${EMOJI.bullet} Add new courses\n` +
      `${EMOJI.bullet} Manage existing courses\n` +
      `${EMOJI.bullet} View statistics`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
    
  } catch (error) {
    log.error('Admin panel callback error', { error: error.message });
  }
}

module.exports = {
  handleAdminPanel,
  handleUploadStart,
  handleUploadCollegeSelect,
  handleUploadDeptSelect,
  handleUploadYearSelect,
  handleUploadSemSelect,
  handleUploadCourseSelect,
  handleUploadTypeSelect,
  handleUploadNewCourse,
  handleUploadTextInput,
  handleFileUpload,
  handleAddCourseStart,
  handleAddCourseCollegeSelect,
  handleAddCourseDeptSelect,
  handleAddCourseYearSelect,
  handleAddCourseSemSelect,
  handleManageCourses,
  handleListCourses,
  handleAdminCancel,
  handleAdminPanelCallback,
  isAdmin,
  getUploadSession,
  clearUploadSession
};
