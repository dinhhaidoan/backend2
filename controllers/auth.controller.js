const { registerUser, createAccountWithProfile, loginUser, getAllUsers, getUserByCode, updateUser, deleteUser } = require('../services/auth.service');
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

    // set cookie
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000 // 1 ngày
    });

    res.json({ message: 'Đăng nhập thành công', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie(cookieName);
  res.json({ message: 'Đăng xuất thành công' });
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
