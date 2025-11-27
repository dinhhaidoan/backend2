const { listAcademicYears, getAcademicYear, createAcademicYear, updateAcademicYear, deleteAcademicYear } = require('../services/academicYear.service');
const { getUserById } = require('../services/auth.service');

// helper to check if user is admin or staff (giáo vụ)
const hasManagePermission = (roleName) => {
  if (!roleName) return false;
  const rn = roleName.toLowerCase();
  return rn.includes('admin') || rn.includes('quản trị') || rn.includes('staff') || rn.includes('giáo vụ') || rn.includes('office');
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, q = '' } = req.query;
    const result = await listAcademicYears({ page, limit, q });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await getAcademicYear(id);
    res.json({ academic_year: row });
  } catch (err) {
    if (err.message === 'AcademicYear not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    // authorization: only staff/admin
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    // If auth middleware already marked user as system manager (admin OR staff), allow immediately
    if (!(req.user && req.user.is_system_manager)) {
      const reqUser = await getUserById(requesterId);
      const roleName = reqUser && reqUser.Role && (reqUser.Role.role_name || '');
      if (!hasManagePermission(roleName)) return res.status(403).json({ error: 'Forbidden' });
    }

    const created = await createAcademicYear(req.body);
    res.status(201).json({ message: 'AcademicYear created', academic_year: created });
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
    const updated = await updateAcademicYear(id, req.body);
    res.json({ message: 'AcademicYear updated', academic_year: updated });
  } catch (err) {
    if (err.message === 'AcademicYear not found') return res.status(404).json({ error: err.message });
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
    const out = await deleteAcademicYear(id);
    res.json(out);
  } catch (err) {
    if (err.message.includes('linked')) return res.status(400).json({ error: err.message });
    if (err.message === 'AcademicYear not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};