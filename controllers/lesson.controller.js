const { createLesson, getLessons, getLessonById, updateLesson, deleteLesson } = require('../services/lesson.service');
const { getUserById } = require('../services/auth.service');
const { CourseClass } = require('../models/index.model').models;

const hasManagePermission = (roleName) => {
  if (!roleName) return false;
  const rn = roleName.toLowerCase();
  return rn.includes('admin') || rn.includes('quản trị') || rn.includes('staff') || rn.includes('giáo vụ') || rn.includes('office');
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, course_class_id, teacher_code } = req.query;
    const result = await getLessons({ page, limit, course_class_id, teacher_code });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    const reqUser = await getUserById(requesterId);
    const roleName = reqUser && reqUser.Role && reqUser.Role.role_name;

    // only owner teacher or admin/staff can create lessons for a class
    const course_class_id = req.body.course_class_id;
    if (!course_class_id) return res.status(400).json({ error: 'Missing course_class_id' });
    const cc = await CourseClass.findOne({ where: { course_class_id } });
    if (!cc) return res.status(404).json({ error: 'CourseClass not found' });

    let isOwner = false;
    if (reqUser && reqUser.Teacher && reqUser.Teacher.teacher_id && cc.teacher_id === reqUser.Teacher.teacher_id) isOwner = true;

    if (!isOwner && !hasManagePermission(roleName) && !req.user.is_system_manager) return res.status(403).json({ error: 'Forbidden' });

    // include user_code for created_by resolution
    const user_code = reqUser.user_code;
    const lesson = await createLesson({ lesson: req.body, user_code });
    res.status(201).json({ message: 'Lesson created', lesson });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const { lesson_id } = req.params;
    const lesson = await getLessonById(lesson_id);
    res.json({ lesson });
  } catch (err) {
    if (err.message === 'Lesson not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
    const reqUser = await getUserById(requesterId);
    const roleName = reqUser && reqUser.Role && reqUser.Role.role_name;

    const { lesson_id } = req.params;
    // check existence and permission: only class owner (teacher) or admin/staff can update
    const lesson = await getLessonById(lesson_id);
    const course_class_id = lesson.course_class_id;
    const cc = await CourseClass.findOne({ where: { course_class_id } });
    let isOwner = false;
    if (reqUser && reqUser.Teacher && reqUser.Teacher.teacher_id && cc.teacher_id === reqUser.Teacher.teacher_id) isOwner = true;
    if (!isOwner && !hasManagePermission(roleName) && !req.user.is_system_manager) return res.status(403).json({ error: 'Forbidden' });

    const updated = await updateLesson(lesson_id, { lesson: req.body });
    res.json({ message: 'Lesson updated', lesson: updated });
  } catch (err) {
    if (err.message === 'Lesson not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
    const reqUser = await getUserById(requesterId);
    const roleName = reqUser && reqUser.Role && reqUser.Role.role_name;

    const { lesson_id } = req.params;
    const lesson = await getLessonById(lesson_id);
    const course_class_id = lesson.course_class_id;
    const cc = await CourseClass.findOne({ where: { course_class_id } });
    let isOwner = false;
    if (reqUser && reqUser.Teacher && reqUser.Teacher.teacher_id && cc.teacher_id === reqUser.Teacher.teacher_id) isOwner = true;
    if (!isOwner && !hasManagePermission(roleName) && !req.user.is_system_manager) return res.status(403).json({ error: 'Forbidden' });

    const out = await deleteLesson(lesson_id);
    res.json(out);
  } catch (err) {
    if (err.message === 'Lesson not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};
