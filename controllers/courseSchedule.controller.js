const { listCourseSchedules, getCourseSchedule, createCourseSchedule, updateCourseSchedule, deleteCourseSchedule } = require('../services/courseSchedule.service');
const { getUserById } = require('../services/auth.service');

const hasManagePermission = (roleName) => {
  if (!roleName) return false;
  const rn = roleName.toLowerCase();
  return rn.includes('admin') || rn.includes('quản trị') || rn.includes('staff') || rn.includes('giáo vụ') || rn.includes('office');
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, course_class_id, schedule_type } = req.query;
    const result = await listCourseSchedules({ page, limit, course_class_id, schedule_type });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await getCourseSchedule(id);
    res.json({ course_schedule: schedule });
  } catch (err) {
    if (err.message === 'CourseSchedule not found') return res.status(404).json({ error: err.message });
    return res.status(400).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    if (!(req.user && req.user.is_system_manager)) {
      const reqUser = await getUserById(requesterId);
      const roleName = reqUser && reqUser.Role && (reqUser.Role.role_name || '');
      if (!hasManagePermission(roleName)) return res.status(403).json({ error: 'Forbidden' });
    }

    const created = await createCourseSchedule(req.body);
    res.status(201).json({ message: 'CourseSchedule created', course_schedule: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    if (!(req.user && req.user.is_system_manager)) {
      const reqUser = await getUserById(requesterId);
      const roleName = reqUser && reqUser.Role && (reqUser.Role.role_name || '');
      if (!hasManagePermission(roleName)) return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const updated = await updateCourseSchedule(id, req.body);
    res.json({ message: 'CourseSchedule updated', course_schedule: updated });
  } catch (err) {
    if (err.message === 'CourseSchedule not found') return res.status(404).json({ error: err.message });
    return res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    if (!(req.user && req.user.is_system_manager)) {
      const reqUser = await getUserById(requesterId);
      const roleName = reqUser && reqUser.Role && (reqUser.Role.role_name || '');
      if (!hasManagePermission(roleName)) return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const out = await deleteCourseSchedule(id);
    res.json(out);
  } catch (err) {
    if (err.message === 'CourseSchedule not found') return res.status(404).json({ error: err.message });
    return res.status(400).json({ error: err.message });
  }
};
