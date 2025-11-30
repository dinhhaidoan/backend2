const { createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment } = require('../services/assignment.service');
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
    const result = await getAssignments({ page, limit, course_class_id, teacher_code });
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
    const roleName = reqUser && reqUser.Role && (reqUser.Role.role_name || '');

    const course_class_id = req.body.course_class_id;
    if (!course_class_id) return res.status(400).json({ error: 'Missing course_class_id' });
    const cc = await CourseClass.findOne({ where: { course_class_id } });
    if (!cc) return res.status(404).json({ error: 'CourseClass not found' });

    let isOwner = false;
    if (reqUser && reqUser.Teacher && reqUser.Teacher.teacher_id && cc.teacher_id === reqUser.Teacher.teacher_id) isOwner = true;
    if (!isOwner && !hasManagePermission(roleName) && !req.user.is_system_manager) return res.status(403).json({ error: 'Forbidden' });

    const assignment = await createAssignment({ assignment: req.body, user_code: reqUser.user_code });
    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const assignment = await getAssignmentById(assignment_id);
    res.json({ assignment });
  } catch (err) {
    if (err.message === 'Assignment not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
    const reqUser = await getUserById(requesterId);
    const roleName = reqUser && reqUser.Role && reqUser.Role.role_name;

    const { assignment_id } = req.params;
    const assignment = await getAssignmentById(assignment_id);
    const course_class_id = assignment.course_class_id;
    const cc = await CourseClass.findOne({ where: { course_class_id } });
    let isOwner = false;
    if (reqUser && reqUser.Teacher && reqUser.Teacher.teacher_id && cc.teacher_id === reqUser.Teacher.teacher_id) isOwner = true;
    if (!isOwner && !hasManagePermission(roleName) && !req.user.is_system_manager) return res.status(403).json({ error: 'Forbidden' });

    const updated = await updateAssignment(assignment_id, { assignment: req.body });
    res.json({ message: 'Assignment updated', assignment: updated });
  } catch (err) {
    if (err.message === 'Assignment not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
    const reqUser = await getUserById(requesterId);
    const roleName = reqUser && reqUser.Role && reqUser.Role.role_name;

    const { assignment_id } = req.params;
    const assignment = await getAssignmentById(assignment_id);
    const course_class_id = assignment.course_class_id;
    const cc = await CourseClass.findOne({ where: { course_class_id } });
    let isOwner = false;
    if (reqUser && reqUser.Teacher && reqUser.Teacher.teacher_id && cc.teacher_id === reqUser.Teacher.teacher_id) isOwner = true;
    if (!isOwner && !hasManagePermission(roleName) && !req.user.is_system_manager) return res.status(403).json({ error: 'Forbidden' });

    const out = await deleteAssignment(assignment_id);
    res.json(out);
  } catch (err) {
    if (err.message === 'Assignment not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};
