const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
// index.model.js exports { sequelize, models, initDb }
const { sequelize, models } = require('../models/index.model');
const { User, Role, Student, Teacher, Staff, Admin, ParentStudent, AcademicDegree, Position, Major } = models;
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { secret, expiresIn } = require('../config/jwt');

// helper: pick allowed keys from object
const pick = (obj = {}, keys = []) => {
  const out = {};
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  }
  return out;
};

const registerUser = async ({ user_code, user_email, user_password, user_phone, role_id }) => {
  // Basic user-only registration (no profile). Kept for compatibility.
  if (!user_code) throw new Error('Vui lòng cung cấp user_code');
  if (!user_password) throw new Error('Vui lòng cung cấp mật khẩu');

  const existingByCode = await User.findOne({ where: { user_code } });
  if (existingByCode) throw new Error('Mã người dùng (user_code) đã tồn tại');

  if (user_email) {
    const existingByEmail = await User.findOne({ where: { user_email } });
    if (existingByEmail) throw new Error('Email đã tồn tại');
  }

  const hashedPassword = await hashPassword(user_password);
  const newUser = await User.create({ user_code, user_email, user_password: hashedPassword, user_phone, role_id });

  return { message: 'Đăng ký thành công', user: { id: newUser.user_id, user_code: newUser.user_code, user_email: newUser.user_email } };
};

/**
 * Create user and profile (Student/Teacher/Staff/Admin) in a transaction.
 * payload shape:
 * {
 *   user: { user_code, user_email, user_password, user_phone },
 *   role_name || role_id,
 *   profile: { ... } // fields required for the profile type
 * }
 */
const createAccountWithProfile = async ({ user: userData, role_name, role_id, profile: profileData }) => {
  if (!userData || !userData.user_code || !userData.user_password) throw new Error('Vui lòng cung cấp thông tin user đầy đủ (user_code & user_password)');
  if (!role_name && !role_id) throw new Error('Vui lòng cung cấp role_name hoặc role_id');

  // Resolve role_name if only role_id provided
  let role;
  if (role_id) {
    role = await Role.findOne({ where: { role_id } });
    if (!role) throw new Error('Role không tồn tại');
    role_name = role.role_name;
  } else {
    role = await Role.findOne({ where: { role_name } });
    if (!role) throw new Error('Role không tồn tại');
  }

  // Determine type from role_name using seeded role names for exact match when possible.
  const rn = (role.role_name || '').trim();
  const rnLower = rn.toLowerCase();
  const isStudent = rn === 'Sinh viên' || rnLower.includes('sinh') || rnLower.includes('student');
  const isTeacher = rn === 'Giảng viên' || rnLower.includes('giảng') || rnLower.includes('teacher');
  const isStaff = rn === 'Giáo vụ khoa' || rnLower.includes('giáo vụ') || rnLower.includes('staff') || rnLower.includes('office');
  const isAdmin = rn === 'Quản trị viên' || rnLower.includes('quản trị') || rnLower.includes('admin');

  return await sequelize.transaction(async (t) => {
    // Check duplicates
    const existsCode = await User.findOne({ where: { user_code: userData.user_code }, transaction: t });
    if (existsCode) throw new Error('Mã người dùng đã tồn tại');
    if (userData.user_email) {
      const existsEmail = await User.findOne({ where: { user_email: userData.user_email }, transaction: t });
      if (existsEmail) throw new Error('Email đã tồn tại');
    }

    const hashed = await hashPassword(userData.user_password);
    // allowed user fields to persist
    const allowedUserFields = ['user_code', 'user_email', 'user_password', 'user_phone', 'user_avatar', 'is_active'];
    const userToCreate = pick(userData, allowedUserFields);
    userToCreate.user_password = hashed;
    userToCreate.role_id = role.role_id;
    if (userToCreate.user_email === undefined) userToCreate.user_email = null;
    if (userToCreate.user_phone === undefined) userToCreate.user_phone = null;

    const newUser = await User.create(userToCreate, { transaction: t });

    // Create profile according to role
    if (isStudent) {
      // required fields: student_name, student_code, academic_year_id, major_id, office_class_id
      const { student_name, student_code, academic_year_id, major_id, office_class_id } = profileData || {};
      if (!student_name || !student_code || !academic_year_id || !major_id || !office_class_id) {
        throw new Error('Missing student profile fields: student_name, student_code, academic_year_id, major_id, office_class_id');
      }
      const studentAllowed = ['student_name','student_code','student_birthdate','student_gender','student_address','student_CCCD','student_place_of_birth','student_day_joined','student_year_expected','academic_year_id','major_id','office_class_id','student_active'];
      const studentPayload = pick(profileData, studentAllowed);
      studentPayload.user_id = newUser.user_id;
      const savedStudent = await Student.create(studentPayload, { transaction: t });

      // create ParentStudent rows if provided in profileData.parents
      if (Array.isArray(profileData.parents) && profileData.parents.length) {
        const parentAllowed = ['parent_name', 'parent_relationship', 'parent_contact'];
        for (const p of profileData.parents) {
          const payload = pick(p, parentAllowed);
          if (!payload.parent_name || !payload.parent_relationship) {
            throw new Error('Missing parent fields: parent_name and parent_relationship are required');
          }
          payload.student_id = savedStudent.student_id;
          await ParentStudent.create(payload, { transaction: t });
        }
      }
    } else if (isTeacher) {
      const { teacher_name, teacher_code, academic_degree_id, position_id } = profileData || {};
      if (!teacher_name || !teacher_code || !academic_degree_id || !position_id) {
        throw new Error('Missing teacher profile fields: teacher_name, teacher_code, academic_degree_id, position_id');
      }
      const teacherAllowed = ['teacher_name','teacher_code','teacher_birthdate','teacher_gender','teacher_days_of_joining','teacher_active','teacher_notes','academic_degree_id','position_id'];
      const teacherPayload = pick(profileData, teacherAllowed);
      teacherPayload.user_id = newUser.user_id;
      await Teacher.create(teacherPayload, { transaction: t });
    } else if (isStaff) {
      const { staff_name, staff_code } = profileData || {};
      if (!staff_name || !staff_code) throw new Error('Missing staff profile fields: staff_name, staff_code');
      const staffAllowed = ['staff_name','staff_code','staff_birthdate','staff_gender'];
      const staffPayload = pick(profileData, staffAllowed);
      staffPayload.user_id = newUser.user_id;
      await Staff.create(staffPayload, { transaction: t });
    } else if (isAdmin) {
      const { admin_name, admin_code } = profileData || {};
      if (!admin_name || !admin_code) throw new Error('Missing admin profile fields: admin_name, admin_code');
      const adminAllowed = ['admin_name','admin_code','admin_birthdate','admin_gender'];
      const adminPayload = pick(profileData, adminAllowed);
      adminPayload.user_id = newUser.user_id;
      await Admin.create(adminPayload, { transaction: t });
    } else {
      // Role not recognized — rollback
      throw new Error('Role không được hỗ trợ để tạo profile tự động');
    }

    const createdUser = await User.findOne({ where: { user_id: newUser.user_id }, attributes: { exclude: ['user_password'] }, include: [
      { model: Role, attributes: ['role_id','role_name'] },
      { model: Student, include: [ { model: ParentStudent } ] },
      { model: Teacher, include: [ { model: AcademicDegree, attributes: ['academic_degree_id','academic_degree_name'] }, { model: Position, attributes: ['position_id','position_name'] } ] },
      { model: Staff },
      { model: Admin }
    ], transaction: t });
    return { message: 'Tạo tài khoản và hồ sơ thành công', user: createdUser, role: role.role_name };
  });
};

const loginUser = async ({ user_code, user_email, password, user_password }) => {
  // Normalize password field: accept `password` or `user_password` from client
  const pwd = password || user_password;

  if (!pwd) throw new Error('Vui lòng cung cấp mật khẩu');
  if (!user_code && !user_email) throw new Error('Vui lòng cung cấp user_code hoặc user_email');

  const where = user_code ? { user_code } : { user_email };
  const user = await User.findOne({ where });
  if (!user) throw new Error('Tài khoản không tồn tại');

  const valid = await comparePassword(pwd, user.user_password);
  if (!valid) throw new Error('Mật khẩu không đúng');

  // Update last_login timestamp
  await User.update(
    { last_login: new Date() },
    { where: { user_id: user.user_id } }
  );

  const token = jwt.sign({ id: user.user_id, role_id: user.role_id }, secret, { expiresIn });

  return {
    user: {
      id: user.user_id,
      user_code: user.user_code,
      user_email: user.user_email,
      role_id: user.role_id,
    },
    token,
  };
};


const getAllUsers = async () => {
  // Return all users with related profile records and role, exclude password
  const users = await User.findAll({
    attributes: { exclude: ['user_password'] },
    include: [
      { model: Role, attributes: ['role_id', 'role_name'] },
      { model: Student, include: [ { model: ParentStudent } ] },
        { model: Teacher, include: [ { model: AcademicDegree, attributes: ['academic_degree_id','academic_degree_name'] }, { model: Position, attributes: ['position_id','position_name'] } ] },
        { model: Staff },
        { model: Admin },
      ],
  });

  return users;
};

const getUserByCode = async (user_code) => {
  if (!user_code) throw new Error('Vui lòng cung cấp user_code');
  const user = await User.findOne({
    where: { user_code },
    attributes: { exclude: ['user_password'] },
    include: [
      { model: Role, attributes: ['role_id', 'role_name'] },
      { model: Student, include: [ { model: ParentStudent } ] },
      { model: Teacher, include: [ { model: AcademicDegree, attributes: ['academic_degree_id','academic_degree_name'] }, { model: Position, attributes: ['position_id','position_name'] } ] },
      { model: Staff },
      { model: Admin },
    ],
  });
  if (!user) throw new Error('User not found');
  return user;
};

/**
 * Update user and role-linked profile in a transaction.
 * - If role changes, will create/update the profile for the new role and remove other role profiles.
 * - If updating password, it will be hashed.
 * - Partial profile updates are supported; when creating a new profile, required fields for that role must be present.
 *
 * Assumptions:
 * - When role changes, previously existing profile records for other roles are deleted.
 */
const updateUser = async (user_code, payload = {}) => {
  if (!user_code) throw new Error('Missing user_code');

  return await sequelize.transaction(async (t) => {
    const user = await User.findOne({ where: { user_code }, transaction: t });
    if (!user) throw new Error('User not found');

    const user_id = user.user_id;

    const { user: userData = {}, role_id: newRoleId, role_name: newRoleName, profile: profileData = {} } = payload;

    // Update user fields
    const allowedUserFields = ['user_code', 'user_email', 'user_password', 'user_phone', 'user_avatar', 'is_active', 'last_login'];
    const userToUpdate = pick(userData, allowedUserFields);
    if (userToUpdate.user_password) {
      userToUpdate.user_password = await hashPassword(userToUpdate.user_password);
    }

    // Determine resulting role: prefer explicit newRoleId/newRoleName, otherwise keep existing
    let role = null;
    if (newRoleId) {
      role = await Role.findOne({ where: { role_id: newRoleId }, transaction: t });
      if (!role) throw new Error('Role không tồn tại');
      userToUpdate.role_id = role.role_id;
    } else if (newRoleName) {
      role = await Role.findOne({ where: { role_name: newRoleName }, transaction: t });
      if (!role) throw new Error('Role không tồn tại');
      userToUpdate.role_id = role.role_id;
    } else if (user.role_id) {
      role = await Role.findOne({ where: { role_id: user.role_id }, transaction: t });
    }

    // Apply user update (if any fields present)
    if (Object.keys(userToUpdate).length) {
      await User.update(userToUpdate, { where: { user_id }, transaction: t });
    }

    // If no role resolved, nothing to do for profile
    if (!role) {
      const updated = await User.findOne({ where: { user_id }, attributes: { exclude: ['user_password'] }, transaction: t });
      return updated;
    }

    const rn = (role.role_name || '').trim();
    const rnLower = rn.toLowerCase();
    const isStudent = rn === 'Sinh viên' || rnLower.includes('sinh') || rnLower.includes('student');
    const isTeacher = rn === 'Giảng viên' || rnLower.includes('giảng') || rnLower.includes('teacher');
    const isStaff = rn === 'Giáo vụ khoa' || rnLower.includes('giáo vụ') || rnLower.includes('staff') || rnLower.includes('office');
    const isAdmin = rn === 'Quản trị viên' || rnLower.includes('quản trị') || rnLower.includes('admin');

    // Helper: delete profiles that are not the target role
    const deleteIfNotTarget = async () => {
      if (!isStudent) await Student.destroy({ where: { user_id }, transaction: t });
      if (!isTeacher) await Teacher.destroy({ where: { user_id }, transaction: t });
      if (!isStaff) await Staff.destroy({ where: { user_id }, transaction: t });
      if (!isAdmin) await Admin.destroy({ where: { user_id }, transaction: t });
    };

    // Update or create profile for the target role
    if (isStudent) {
      // allowed and required fields
      const studentAllowed = ['student_name','student_code','student_birthdate','student_gender','student_address','student_CCCD','student_place_of_birth','student_day_joined','student_year_expected','academic_year_id','major_id','office_class_id','student_active'];
      const studentPayload = pick(profileData, studentAllowed);
      studentPayload.user_id = user_id;

      // If existing student -> update, else create (require minimal fields)
      const existing = await Student.findOne({ where: { user_id }, transaction: t });
      if (existing) {
        if (Object.keys(studentPayload).length) await Student.update(studentPayload, { where: { user_id }, transaction: t });
        // If parents array provided, update parent records: delete old + create new
        if (Array.isArray(profileData.parents)) {
          // delete existing parents for this student
          await ParentStudent.destroy({ where: { student_id: existing.student_id }, transaction: t });
          const parentAllowed = ['parent_name', 'parent_relationship', 'parent_contact'];
          for (const p of profileData.parents) {
            const payload = pick(p, parentAllowed);
            if (!payload.parent_name || !payload.parent_relationship) {
              throw new Error('Missing parent fields: parent_name and parent_relationship are required');
            }
            payload.student_id = existing.student_id;
            await ParentStudent.create(payload, { transaction: t });
          }
        }
      } else {
        const { student_name, student_code, academic_year_id, major_id, office_class_id } = studentPayload;
        if (!student_name || !student_code || !academic_year_id || !major_id || !office_class_id) {
          throw new Error('Thiếu trường bắt buộc khi tạo hồ sơ Sinh viên: student_name, student_code, academic_year_id, major_id, office_class_id');
        }
        const savedSt = await Student.create(studentPayload, { transaction: t });
        if (Array.isArray(profileData.parents) && profileData.parents.length) {
          const parentAllowed = ['parent_name', 'parent_relationship', 'parent_contact'];
          for (const p of profileData.parents) {
            const payload = pick(p, parentAllowed);
            if (!payload.parent_name || !payload.parent_relationship) {
              throw new Error('Missing parent fields: parent_name and parent_relationship are required');
            }
            payload.student_id = savedSt.student_id;
            await ParentStudent.create(payload, { transaction: t });
          }
        }
      }
      await deleteIfNotTarget();
    } else if (isTeacher) {
      const teacherAllowed = ['teacher_name','teacher_code','teacher_birthdate','teacher_gender','teacher_days_of_joining','teacher_active','teacher_notes','academic_degree_id','position_id'];
      const teacherPayload = pick(profileData, teacherAllowed);
      teacherPayload.user_id = user_id;

      const existing = await Teacher.findOne({ where: { user_id }, transaction: t });
      if (existing) {
        if (Object.keys(teacherPayload).length) await Teacher.update(teacherPayload, { where: { user_id }, transaction: t });
      } else {
        const { teacher_name, teacher_code, academic_degree_id, position_id } = teacherPayload;
        if (!teacher_name || !teacher_code || !academic_degree_id || !position_id) {
          throw new Error('Thiếu trường bắt buộc khi tạo hồ sơ Giảng viên: teacher_name, teacher_code, academic_degree_id, position_id');
        }
        await Teacher.create(teacherPayload, { transaction: t });
      }
      await deleteIfNotTarget();
    } else if (isStaff) {
      const staffAllowed = ['staff_name','staff_code','staff_birthdate','staff_gender'];
      const staffPayload = pick(profileData, staffAllowed);
      staffPayload.user_id = user_id;

      const existing = await Staff.findOne({ where: { user_id }, transaction: t });
      if (existing) {
        if (Object.keys(staffPayload).length) await Staff.update(staffPayload, { where: { user_id }, transaction: t });
      } else {
        const { staff_name, staff_code } = staffPayload;
        if (!staff_name || !staff_code) throw new Error('Thiếu trường bắt buộc khi tạo hồ sơ Staff: staff_name, staff_code');
        await Staff.create(staffPayload, { transaction: t });
      }
      await deleteIfNotTarget();
    } else if (isAdmin) {
      const adminAllowed = ['admin_name','admin_code','admin_birthdate','admin_gender'];
      const adminPayload = pick(profileData, adminAllowed);
      adminPayload.user_id = user_id;

      const existing = await Admin.findOne({ where: { user_id }, transaction: t });
      if (existing) {
        if (Object.keys(adminPayload).length) await Admin.update(adminPayload, { where: { user_id }, transaction: t });
      } else {
        const { admin_name, admin_code } = adminPayload;
        if (!admin_name || !admin_code) throw new Error('Thiếu trường bắt buộc khi tạo hồ sơ Admin: admin_name, admin_code');
        await Admin.create(adminPayload, { transaction: t });
      }
      await deleteIfNotTarget();
    } else {
      // Role not recognized — do nothing special
    }

    const updatedUser = await User.findOne({ where: { user_id }, attributes: { exclude: ['user_password'] }, include: [
      { model: Role, attributes: ['role_id', 'role_name'] },
      { model: Student },
      { model: Teacher, include: [ { model: AcademicDegree, attributes: ['academic_degree_id','academic_degree_name'] }, { model: Position, attributes: ['position_id','position_name'] } ] },
      { model: Staff },
      { model: Admin }
    ], transaction: t });
    return updatedUser;
  });
};

module.exports = { registerUser, createAccountWithProfile, loginUser, getAllUsers, getUserByCode, updateUser };

const getUserById = async (user_id) => {
  if (!user_id) throw new Error('Missing user_id');
  const user = await User.findOne({
    where: { user_id },
    attributes: { exclude: ['user_password'] },
    include: [
      { model: Role, attributes: ['role_id', 'role_name'] },
      { model: Student, include: [ { model: ParentStudent } ] },
      { model: Teacher, include: [ { model: AcademicDegree, attributes: ['academic_degree_id','academic_degree_name'] }, { model: Position, attributes: ['position_id','position_name'] } ] },
      { model: Staff },
      { model: Admin },
    ],
  });
  if (!user) throw new Error('User not found');
  return user;
};

module.exports.getUserById = getUserById;

/**
 * Upload an avatar for a user identified by user_code.
 * - fileBuffer: Buffer of image data (from multer memoryStorage)
 * - mimetype: content-type string
 */
const uploadUserAvatar = async (user_code, fileBuffer, mimetype) => {
  if (!user_code) throw new Error('Missing user_code');
  if (!fileBuffer) throw new Error('Missing file data');

  const user = await User.findOne({ where: { user_code } });
  if (!user) throw new Error('User not found');

  // Upload buffer to Cloudinary using upload_stream
  const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'users/avatars', resource_type: 'image' }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      stream.end(buffer);
    });
  };

  // Delete previous avatar on Cloudinary if present
  if (user.user_avatar_public_id) {
    try {
      await cloudinary.uploader.destroy(user.user_avatar_public_id, { resource_type: 'image' });
    } catch (e) {
      // don't fail whole operation if deletion fails, just log
      console.warn('Failed removing old avatar', e.message || e);
    }
  }

  const uploadResult = await streamUpload(fileBuffer);
  // update user record
  user.user_avatar = uploadResult.secure_url || uploadResult.url || null;
  user.user_avatar_public_id = uploadResult.public_id || null;
  await user.save();

  // return updated user (exclude password)
  const updated = await User.findOne({ where: { user_id: user.user_id }, attributes: { exclude: ['user_password'] } });
  return updated;
};

const deleteUserAvatar = async (user_code) => {
  if (!user_code) throw new Error('Missing user_code');
  const user = await User.findOne({ where: { user_code } });
  if (!user) throw new Error('User not found');

  if (user.user_avatar_public_id) {
    try {
      await cloudinary.uploader.destroy(user.user_avatar_public_id, { resource_type: 'image' });
    } catch (e) {
      console.warn('Failed to delete avatar from Cloudinary', e.message || e);
    }
  }

  user.user_avatar = null;
  user.user_avatar_public_id = null;
  await user.save();
  return { message: 'Avatar deleted' };
};

module.exports.uploadUserAvatar = uploadUserAvatar;
module.exports.deleteUserAvatar = deleteUserAvatar;

// Lookup helpers for frontend (dropdowns)
const { Op } = require('sequelize');

const getAcademicDegrees = async () => {
  return await AcademicDegree.findAll({ attributes: ['academic_degree_id','academic_degree_name'], order: [['academic_degree_id','ASC']] });
};

const getPositions = async () => {
  return await Position.findAll({ attributes: ['position_id','position_name'], order: [['position_id','ASC']] });
};

module.exports.getAcademicDegrees = getAcademicDegrees;
module.exports.getPositions = getPositions;

const getMajors = async () => {
  // Major model may be seeded/hardcoded via Major.seedDefaults; return available majors
  return await Major.findAll({ attributes: ['major_id', 'major_name'], order: [['major_id', 'ASC']] });
};

module.exports.getMajors = getMajors;

/**
 * Get teacher profile by teacher_code including AcademicDegree and User info
 */
const getTeacherByTeacherCode = async (teacher_code) => {
  if (!teacher_code) throw new Error('Missing teacher_code');
  const teacher = await Teacher.findOne({
    where: { teacher_code },
    include: [
      { model: AcademicDegree, attributes: ['academic_degree_id','academic_degree_name'] },
      { model: Position, attributes: ['position_id','position_name'] },
      { model: User, attributes: ['user_id','user_code','user_email'] },
    ],
  });
  if (!teacher) throw new Error('Teacher not found');
  return teacher;
};

module.exports.getTeacherByTeacherCode = getTeacherByTeacherCode;

/**
 * Return paginated users who are Teachers.
 * Options: { page, limit, q }
 */
const getTeachers = async ({ page = 1, limit = 20, q = '' } = {}) => {
  const offset = Math.max(0, (Number(page) - 1)) * Number(limit);

  // Build search condition: user_code, user_email, teacher_name, teacher_code
  const search = q && q.trim() ? q.trim() : null;

  const where = {};

  // We'll apply search through include where or root-level fields using sequelize $ notation where needed
  const include = [
    { model: Role, attributes: ['role_id', 'role_name'], where: { role_name: { [Op.like]: '%Giảng%' } } },
    { model: Teacher, include: [ { model: AcademicDegree, attributes: ['academic_degree_id','academic_degree_name'] }, { model: Position, attributes: ['position_id','position_name'] } ] },
  ];

  // If search provided, apply OR on user_code/user_email and teacher fields
  if (search) {
    where[Op.or] = [
      { user_code: { [Op.like]: `%${search}%` } },
      { user_email: { [Op.like]: `%${search}%` } },
      // teacher fields will be filtered via include using $Teacher.teacher_name$ notation
    ];
  }

  const result = await User.findAndCountAll({
    where,
    attributes: { exclude: ['user_password'] },
    include,
    limit: Number(limit),
    offset,
    order: [['user_id','DESC']],
  });

  // If q present, filter out by teacher fields not covered by root where (Sequelize cannot easily mix $include$ conditions when using findAndCountAll with include.where locked)
  // To support searches for teacher_name or teacher_code, do simple post-filter if necessary
  let items = result.rows;
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(u => {
      const t = u.Teacher || {};
      return (t.teacher_name && t.teacher_name.toLowerCase().includes(s)) || (t.teacher_code && t.teacher_code.toLowerCase().includes(s)) || true;
    });
  }

  return {
    items,
    total: result.count,
    page: Number(page),
    limit: Number(limit),
    lastPage: Math.ceil(result.count / Number(limit) || 1),
  };
};

module.exports.getTeachers = getTeachers;

/**
 * Delete user and all linked profile data according to role.
 * - Removes ParentStudent records linked to any Student profile for the user.
 * - Removes Student, Teacher, Staff, Admin profiles for the user.
 * - Finally removes the User record.
 */
const deleteUser = async (user_code) => {
  if (!user_code) throw new Error('Missing user_code');

  return await sequelize.transaction(async (t) => {
    const user = await User.findOne({ where: { user_code }, transaction: t });
    if (!user) throw new Error('User not found');

    const user_id = user.user_id;

    // Delete ParentStudent entries for student's linked to this user
    const students = await Student.findAll({ where: { user_id }, transaction: t });
    if (students && students.length) {
      const studentIds = students.map(s => s.student_id);
      await ParentStudent.destroy({ where: { student_id: studentIds }, transaction: t });
    }

    // Delete profile rows
    await Student.destroy({ where: { user_id }, transaction: t });
    await Teacher.destroy({ where: { user_id }, transaction: t });
    await Staff.destroy({ where: { user_id }, transaction: t });
    await Admin.destroy({ where: { user_id }, transaction: t });

    // Finally delete the user
    await User.destroy({ where: { user_id }, transaction: t });

    return { message: 'Xóa user và hồ sơ liên quan thành công', user_code };
  });
};

// export deleteUser
module.exports.deleteUser = deleteUser;
