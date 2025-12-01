const { sequelize, models } = require('../models/index.model');
const { Lesson, LessonYoutubeLink, LessonDriveLink, CourseClass } = models;
const { Op } = require('sequelize');

const validLinkTypes = ['youtube', 'drive'];

const listLessons = async ({ page = 1, limit = 20, course_class_id, q = '', status } = {}) => {
  const offset = Math.max(0, (Number(page) - 1)) * Number(limit);
  const where = {};
  if (course_class_id) where.lesson_course_class_id = Number(course_class_id);
  if (status) where.lesson_status = status;
  if (q && String(q).trim()) {
    const s = `%${String(q).trim()}%`;
    where[Op.or] = [{ lesson_title: { [Op.like]: s } }, { lesson_description: { [Op.like]: s } }];
  }

  const rows = await Lesson.findAndCountAll({ where, limit: Number(limit), offset, include: [LessonYoutubeLink, LessonDriveLink], order: [['lesson_date', 'DESC']], distinct: true });
  return { items: rows.rows, total: rows.count, page: Number(page), limit: Number(limit), lastPage: Math.ceil(rows.count / Number(limit) || 1) };
};

const getLesson = async (id) => {
  if (!id) throw new Error('Missing lesson_id');
  const row = await Lesson.findOne({ where: { lesson_id: id }, include: [LessonYoutubeLink, LessonDriveLink] });
  if (!row) throw new Error('Lesson not found');
  return row;
};

const createLesson = async ({ lesson: lessonData = {}, youtube_links = [], drive_links = [] } = {}) => {
  if (!lessonData || !lessonData.lesson_title) throw new Error('lesson_title is required');
  if (!lessonData.lesson_course_class_id) throw new Error('lesson_course_class_id is required');
  const courseClass = await CourseClass.findOne({ where: { course_class_id: Number(lessonData.lesson_course_class_id) } });
  if (!courseClass) throw new Error('course_class not found');

  return await sequelize.transaction(async (t) => {
    const allowed = ['lesson_course_class_id', 'lesson_title', 'lesson_date', 'lesson_duration', 'lesson_status', 'lesson_description', 'lesson_google_meet_link', 'lesson_created_at', 'lesson_updated_at'];
    const payload = {};
    for (const k of allowed) if (Object.prototype.hasOwnProperty.call(lessonData, k)) payload[k] = lessonData[k];

    const created = await Lesson.create(payload, { transaction: t });

    // create youtube links if any (array of { label?, url })
    if (Array.isArray(youtube_links) && youtube_links.length) {
      for (const y of youtube_links) {
        if (!y || typeof y !== 'object') continue;
        const url = (y.url || '').trim();
        if (!url) continue;
        await LessonYoutubeLink.create({ lesson_youtube_link_lesson_id: created.lesson_id, lesson_youtube_link_label: y.label || null, lesson_youtube_link_url: url }, { transaction: t });
      }
    }
    // create drive links if any
    if (Array.isArray(drive_links) && drive_links.length) {
      for (const d of drive_links) {
        if (!d || typeof d !== 'object') continue;
        const url = (d.url || '').trim();
        if (!url) continue;
        await LessonDriveLink.create({ lesson_drive_link_lesson_id: created.lesson_id, lesson_drive_link_label: d.label || null, lesson_drive_link_url: url }, { transaction: t });
      }
    }

    // Return the created lesson from within the same transaction so it can read uncommitted data
    const row = await Lesson.findOne({ where: { lesson_id: created.lesson_id }, include: [LessonYoutubeLink, LessonDriveLink], transaction: t });
    if (!row) throw new Error('Lesson not found');
    return row;
  });
};

const updateLesson = async (id, { lesson: lessonData = {}, youtube_links, drive_links } = {}) => {
  if (!id) throw new Error('Missing lesson_id');
  return await sequelize.transaction(async (t) => {
    const existing = await Lesson.findOne({ where: { lesson_id: id }, transaction: t });
    if (!existing) throw new Error('Lesson not found');

    const allowed = ['lesson_course_class_id', 'lesson_title', 'lesson_date', 'lesson_duration', 'lesson_status', 'lesson_description', 'lesson_google_meet_link', 'lesson_updated_at'];
    const payload = {};
    for (const k of allowed) if (Object.prototype.hasOwnProperty.call(lessonData, k)) payload[k] = lessonData[k];
    if (!payload.lesson_updated_at) payload.lesson_updated_at = new Date();
    if (Object.keys(payload).length) await Lesson.update(payload, { where: { lesson_id: id }, transaction: t });

    // Replace links if arrays provided (replace mode)
    if (Array.isArray(youtube_links)) {
      // delete existing youtube links
      await LessonYoutubeLink.destroy({ where: { lesson_youtube_link_lesson_id: id }, transaction: t });
      for (const y of youtube_links || []) {
        if (!y || typeof y !== 'object') continue;
        const url = (y.url || '').trim();
        if (!url) continue;
        await LessonYoutubeLink.create({ lesson_youtube_link_lesson_id: id, lesson_youtube_link_label: y.label || null, lesson_youtube_link_url: url }, { transaction: t });
      }
    }
    if (Array.isArray(drive_links)) {
      // delete existing drive links
      await LessonDriveLink.destroy({ where: { lesson_drive_link_lesson_id: id }, transaction: t });
      for (const d of drive_links || []) {
        if (!d || typeof d !== 'object') continue;
        const url = (d.url || '').trim();
        if (!url) continue;
        await LessonDriveLink.create({ lesson_drive_link_lesson_id: id, lesson_drive_link_label: d.label || null, lesson_drive_link_url: url }, { transaction: t });
      }
    }

    // Return updated lesson using the same transaction to include changes
    const row = await Lesson.findOne({ where: { lesson_id: id }, include: [LessonYoutubeLink, LessonDriveLink], transaction: t });
    if (!row) throw new Error('Lesson not found');
    return row;
  });
};

const deleteLesson = async (id) => {
  if (!id) throw new Error('Missing lesson_id');
  return await sequelize.transaction(async (t) => {
    const x = await Lesson.findOne({ where: { lesson_id: id }, transaction: t });
    if (!x) throw new Error('Lesson not found');
    await LessonYoutubeLink.destroy({ where: { lesson_youtube_link_lesson_id: id }, transaction: t });
    await LessonDriveLink.destroy({ where: { lesson_drive_link_lesson_id: id }, transaction: t });
    await Lesson.destroy({ where: { lesson_id: id }, transaction: t });
    return { message: 'Deleted', lesson_id: id };
  });
};

module.exports = { listLessons, getLesson, createLesson, updateLesson, deleteLesson };
