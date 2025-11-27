const { listOfficeClasses, getOfficeClass, createOfficeClass, updateOfficeClass, deleteOfficeClass } = require('../services/officeClass.service');
const { getUserById } = require('../services/auth.service');

const hasManagePermission = (roleName) => {
  if (!roleName) return false;
  const rn = roleName.toLowerCase();
  return rn.includes('admin') || rn.includes('quản trị') || rn.includes('staff') || rn.includes('giáo vụ') || rn.includes('office');
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, q = '' } = req.query;
    const result = await listOfficeClasses({ page, limit, q });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await getOfficeClass(id);
    res.json({ office_class: row });
  } catch (err) {
    if (err.message === 'OfficeClass not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    // allow staff/admin (or fallback to full check)
    if (!(req.user && req.user.is_system_manager)) {
      const reqUser = await getUserById(requesterId);
      const roleName = reqUser && reqUser.Role && (reqUser.Role.role_name || '');
      if (!hasManagePermission(roleName)) return res.status(403).json({ error: 'Forbidden' });
    }

    const created = await createOfficeClass(req.body);
    res.status(201).json({ message: 'OfficeClass created', office_class: created });
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
    const updated = await updateOfficeClass(id, req.body);
    res.json({ message: 'OfficeClass updated', office_class: updated });
  } catch (err) {
    if (err.message === 'OfficeClass not found') return res.status(404).json({ error: err.message });
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
    const out = await deleteOfficeClass(id);
    res.json(out);
  } catch (err) {
    if (err.message === 'OfficeClass not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};
