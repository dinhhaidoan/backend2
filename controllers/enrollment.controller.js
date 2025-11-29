const { listEnrollments, getEnrollment, enrollStudent, updateEnrollment, dropEnrollment, deleteEnrollment } = require('../services/enrollment.service');
const { getUserById } = require('../services/auth.service');

const hasManagePermission = (roleName) => {
  if (!roleName) return false;
  const rn = roleName.toLowerCase();
  return rn.includes('admin') || rn.includes('quản trị') || rn.includes('staff') || rn.includes('giáo vụ') || rn.includes('office');
};

exports.list = async (req, res) => {
  try {
    const { course_class_id, group_id, student_id, page = 1, limit = 20 } = req.query;
    const result = await listEnrollments({ course_class_id, group_id, student_id, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await getEnrollment(id);
    res.json({ enrollment: row });
  } catch (err) {
    if (err.message === 'Enrollment not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.enroll = async (req, res) => {
  try {
    // Allow students to enroll themselves, or staff to enroll
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    const created = await enrollStudent(req.body);
    res.status(201).json({ message: 'Enrolled', enrollment: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const updated = await updateEnrollment(id, req.body);
    res.json({ message: 'Enrollment updated', enrollment: updated });
  } catch (err) {
    if (err.message === 'Enrollment not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.drop = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const updated = await dropEnrollment(id);
    res.json({ message: 'Dropped', enrollment: updated });
  } catch (err) {
    if (err.message === 'Enrollment not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
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
    const out = await deleteEnrollment(id);
    res.json(out);
  } catch (err) {
    if (err.message === 'Enrollment not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};