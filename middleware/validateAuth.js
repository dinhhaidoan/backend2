const { models } = require('../models/index.model');
const { Role } = models;

// helper to check required fields and return missing
const missingFields = (obj = {}, fields = []) => {
  const missing = [];
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || obj[f] === '') missing.push(f);
  }
  return missing;
};

module.exports = {
  validateLogin: (req, res, next) => {
    const { user_code, user_email, password, user_password } = req.body || {};
    const pwd = password || user_password;
    if (!pwd) return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu' });
    if (!user_code && !user_email) return res.status(400).json({ error: 'Vui lòng cung cấp user_code hoặc user_email' });
    next();
  },

  validateRegister: async (req, res, next) => {
    // Accept either top-level fields or nested { user: { ... } }
    const body = req.body || {};
    const userObj = body.user || body;
    const { user_code, user_password } = userObj || {};
    if (!user_code) return res.status(400).json({ error: 'Vui lòng cung cấp user_code' });
    if (!user_password) return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu' });

    // If role_name or role_id and profile provided, validate profile required fields per role
    let roleName = body.role_name;
    if (!roleName && body.role_id) {
      // try to resolve role_name from DB
      try {
        const role = await Role.findOne({ where: { role_id: body.role_id } });
        if (role) roleName = role.role_name;
      } catch (err) {
        // ignore DB errors here; validation will be done in service
      }
    }

    const profile = body.profile || {};
    if (roleName) {
      const rn = roleName.toLowerCase();
      if (rn.includes('sinh')) {
        const required = ['student_name', 'student_code', 'academic_year_id', 'major_id', 'office_class_id'];
        const miss = missingFields(profile, required);
        if (miss.length) return res.status(400).json({ error: 'Thiếu trường hồ sơ sinh viên', missing: miss });
      } else if (rn.includes('giảng')) {
        const required = ['teacher_name', 'teacher_code', 'academic_degree_id', 'position_id'];
        const miss = missingFields(profile, required);
        if (miss.length) return res.status(400).json({ error: 'Thiếu trường hồ sơ giảng viên', missing: miss });
      } else if (rn.includes('giáo vụ') || rn.includes('staff') || rn.includes('office')) {
        const required = ['staff_name', 'staff_code'];
        const miss = missingFields(profile, required);
        if (miss.length) return res.status(400).json({ error: 'Thiếu trường hồ sơ giáo vụ', missing: miss });
      } else if (rn.includes('quản trị') || rn.includes('admin')) {
        const required = ['admin_name', 'admin_code'];
        const miss = missingFields(profile, required);
        if (miss.length) return res.status(400).json({ error: 'Thiếu trường hồ sơ admin', missing: miss });
      }
    }

    next();
  }
};
