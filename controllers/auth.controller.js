const { registerUser, createAccountWithProfile, loginUser, getAllUsers, getUserByCode, updateUser, deleteUser, uploadUserAvatar, getUserById, getAcademicDegrees, getPositions, getTeachers } = require('../services/auth.service');
const { cookieName } = require('../config/jwt');

exports.register = async (req, res) => {
  try {
    // If profile data present or role specified, create user + profile
    const { user, role_name, role_id, profile } = req.body;
    if (user || role_name || role_id || profile) {
      const result = await createAccountWithProfile(req.body);
      return res.status(201).json(result);
    }

    // Fallback: simple user-only registration
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { user, token } = await loginUser(req.body);

    // set cookie with explicit options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
      // also set explicit Expires for clarity in Set-Cookie header
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };

    res.cookie(cookieName, token, cookieOptions);

    // Also return token in response body for Socket.IO auth
    res.json({ 
      message: 'Đăng nhập thành công', 
      user,
      token // Add token to response for frontend to store
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.logout = (req, res) => {
  // clear cookie using same options to ensure browser removes it
  const clearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  };
  res.clearCookie(cookieName, clearOptions);
  res.json({ message: 'Đăng xuất thành công' });
};

exports.me = async (req, res) => {
  try {
    // req.user injected by auth middleware
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { getUserById } = require('../services/auth.service');
    const user = await getUserById(userId);
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserByCode = async (req, res) => {
  try {
    const { user_code } = req.params;
    const user = await getUserByCode(user_code);
    res.json({ user });
  } catch (err) {
    if (err.message === 'User not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.getAvatar = async (req, res) => {
  try {
    const { user_code } = req.params;
    const user = await getUserByCode(user_code);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // only return avatar-related fields
    const avatarResponse = {
      user_id: user.user_id,
      user_code: user.user_code,
      user_avatar: user.user_avatar || null,
      user_avatar_public_id: user.user_avatar_public_id || null,
    };

    res.json({ avatar: avatarResponse });
  } catch (err) {
    if (err.message === 'User not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { user_code } = req.params;
    const result = await updateUser(user_code, req.body);
    res.json({ message: 'Cập nhật user thành công', user: result });
  } catch (err) {
    if (err.message === 'User not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { user_code } = req.params;
    const result = await deleteUser(user_code);
    res.json(result);
  } catch (err) {
    if (err.message === 'User not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const { user_code } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Authorization: only owner or admin can update avatar
    const targetUser = await getUserByCode(user_code);
    const requesterId = req.user && req.user.id;

    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    // allow if the requester is the same user
    let allowed = requesterId === targetUser.user_id;

    // otherwise check if requester is admin role by fetching their user record (role_name included)
    if (!allowed) {
      const reqUser = await getUserById(requesterId);
      const roleName = reqUser && reqUser.Role && (reqUser.Role.role_name || '').toLowerCase();
      if (roleName && (roleName.includes('admin') || roleName.includes('quản trị') || roleName.includes('staff') || roleName.includes('giáo vụ') || roleName.includes('office'))) allowed = true;
    }

    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const updated = await uploadUserAvatar(user_code, file.buffer, file.mimetype);
    res.json({ message: 'Avatar cập nhật thành công', user: updated });
  } catch (err) {
    console.error('uploadAvatar error', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getAcademicDegrees = async (req, res) => {
  try {
    const items = await getAcademicDegrees();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPositions = async (req, res) => {
  try {
    const items = await getPositions();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMajors = async (req, res) => {
  try {
    const { getMajors } = require('../services/auth.service');
    const items = await getMajors();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 20, q = '' } = req.query;
    const result = await getTeachers({ page, limit, q });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTeacherByCode = async (req, res) => {
  try {
    const { teacher_code } = req.params;
    const { getTeacherByTeacherCode } = require('../services/auth.service');
    const teacher = await getTeacherByTeacherCode(teacher_code);
    const degree = (teacher.AcademicDegree && teacher.AcademicDegree.academic_degree_name) || '';
    const display = degree ? `${degree} ${teacher.teacher_name}` : teacher.teacher_name;
    res.json({ teacher, display });
  } catch (err) {
    if (err.message === 'Teacher not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};
