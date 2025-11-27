const { getUserById } = require('../services/auth.service');

module.exports = async (req, res, next) => {
  try {
    const requesterId = req.user && req.user.id;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    const reqUser = await getUserById(requesterId);
    const roleName = reqUser && reqUser.Role && (reqUser.Role.role_name || '').toLowerCase();

    const isStaff = roleName && (roleName.includes('staff') || roleName.includes('giáo vụ') || roleName.includes('office'));
    const isAdmin = roleName && (roleName.includes('admin') || roleName.includes('quản trị'));

    if (isStaff || isAdmin) return next();

    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    console.error('requireSystemManager error', err && err.message);
    return res.status(403).json({ error: 'Forbidden' });
  }
};
