const { sequelize, models } = require('../models/index.model');
const { Lesson, CourseClass, LessonYoutubeLink, LessonDriveLink, User, Teacher } = models;

const pick = (obj = {}, keys = []) => {
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
};

const createLesson = async ({ lesson: lessonData = {}, user_code } = {}) => {
  if (!lessonData) throw new Error('Missing lesson payload');
  if (!lessonData.lesson_title) throw new Error('lesson_title is required');
  if (!lessonData.course_class_id) throw new Error('course_class_id is required');
  if (!lessonData.lesson_date) throw new Error('lesson_date is required');

  return await sequelize.transaction(async (t) => {
    // resolve created_by_user_id
    let created_by = lessonData.created_by_user_id;
    if (!created_by) {
      if (!user_code) throw new Error('Missing created_by user_code or created_by_user_id');
      const user = await User.findOne({ where: { user_code }, transaction: t });
      if (!user) throw new Error('User not found');
      created_by = user.user_id;
    }

    // ensure course class exists
    const cc = await CourseClass.findOne({ where: { course_class_id: lessonData.course_class_id }, transaction: t });
    if (!cc) throw new Error('CourseClass not found');

    // allowed fields
    const allowed = ['lesson_title', 'course_class_id', 'lesson_date', 'lesson_duration_minutes', 'lesson_status', 'lesson_description', 'lesson_meet_link', 'created_by_user_id', 'created_at', 'updated_at'];
    const payload = pick(lessonData, allowed);
    payload.created_by_user_id = created_by;

    const newLesson = await Lesson.create(payload, { transaction: t });

    // handle link arrays
    if (Array.isArray(lessonData.youtube_links) && lessonData.youtube_links.length) {
      for (const url of lessonData.youtube_links) {
        await LessonYoutubeLink.create({ lesson_id: newLesson.lesson_id, url: String(url) }, { transaction: t });
      }
    }
    if (Array.isArray(lessonData.drive_links) && lessonData.drive_links.length) {
      for (const url of lessonData.drive_links) {
        await LessonDriveLink.create({ lesson_id: newLesson.lesson_id, url: String(url) }, { transaction: t });
      }
    }

    const lesson = await Lesson.findOne({ where: { lesson_id: newLesson.lesson_id }, include: [ CourseClass, LessonYoutubeLink, LessonDriveLink ], transaction: t });
    return lesson;
  });
};

const getLessons = async ({ course_class_id, teacher_code, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (course_class_id) where.course_class_id = course_class_id;
  // if teacher_code provided, join CourseClass and filter by teacher
  const offset = (Math.max(1, page) - 1) * limit;

  const include = [ CourseClass, { model: LessonYoutubeLink }, { model: LessonDriveLink } ];
  const query = { where, include, offset, limit, order: [['lesson_date','ASC']], distinct: true };
  if (teacher_code) {
    // find the teacher first
    const teacher = await Teacher.findOne({ where: { teacher_code } });
    if (!teacher) return { rows: [], count: 0 };
    const classes = await CourseClass.findAll({ where: { teacher_id: teacher.teacher_id } });
    const classIds = classes.map(c => c.course_class_id);
    if (!classIds.length) return { rows: [], count: 0 };
    query.where.course_class_id = classIds;
  }

  const lessons = await Lesson.findAndCountAll(query);
  return lessons;
};

const getLessonById = async (lesson_id) => {
  if (!lesson_id) throw new Error('Missing lesson_id');
  const lesson = await Lesson.findOne({ where: { lesson_id }, include: [ CourseClass, LessonYoutubeLink, LessonDriveLink ] });
  if (!lesson) throw new Error('Lesson not found');
  return lesson;
};

const updateLesson = async (lesson_id, { lesson: lessonData = {} } = {}) => {
  if (!lesson_id) throw new Error('Missing lesson_id');
  if (!lessonData || Object.keys(lessonData).length === 0) throw new Error('Empty payload');

  return await sequelize.transaction(async (t) => {
    const existing = await Lesson.findOne({ where: { lesson_id }, transaction: t });
    if (!existing) throw new Error('Lesson not found');

    const allowed = ['lesson_title', 'lesson_date', 'lesson_duration_minutes', 'lesson_status', 'lesson_description', 'lesson_meet_link', 'course_class_id', 'updated_at'];
    const payload = pick(lessonData, allowed);
    if (Object.keys(payload).length) await Lesson.update(payload, { where: { lesson_id }, transaction: t });

    // if youtube_links provided, replace existing
    if (Array.isArray(lessonData.youtube_links)) {
      // delete existing links
      await LessonYoutubeLink.destroy({ where: { lesson_id }, transaction: t });
      for (const url of lessonData.youtube_links) {
        await LessonYoutubeLink.create({ lesson_id, url: String(url) }, { transaction: t });
      }
    }
    if (Array.isArray(lessonData.drive_links)) {
      await LessonDriveLink.destroy({ where: { lesson_id }, transaction: t });
      for (const url of lessonData.drive_links) {
        await LessonDriveLink.create({ lesson_id, url: String(url) }, { transaction: t });
      }
    }

    const lesson = await Lesson.findOne({ where: { lesson_id }, include: [ CourseClass, LessonYoutubeLink, LessonDriveLink ], transaction: t });
    return lesson;
  });
};

const deleteLesson = async (lesson_id) => {
  if (!lesson_id) throw new Error('Missing lesson_id');
  return await sequelize.transaction(async (t) => {
    await LessonYoutubeLink.destroy({ where: { lesson_id }, transaction: t });
    await LessonDriveLink.destroy({ where: { lesson_id }, transaction: t });
    await Lesson.destroy({ where: { lesson_id }, transaction: t });
    return { message: 'Deleted', lesson_id };
  });
};

module.exports = { createLesson, getLessons, getLessonById, updateLesson, deleteLesson };
