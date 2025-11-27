const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const AcademicDegree = require('./academic_degree.model')(sequelize, DataTypes);
const AcademicYear = require('./academic_year.model')(sequelize, DataTypes);
const Semester = require('./semester.model')(sequelize, DataTypes);
const Major = require('./majo.model')(sequelize, DataTypes);
const OfficeClass = require('./office_class.model')(sequelize, DataTypes);
const ParentStudent = require('./parent.student.model')(sequelize, DataTypes);
const Position = require('./position.model')(sequelize, DataTypes);
const Role = require('./role.model')(sequelize, DataTypes);
const Staff = require('./staff.model')(sequelize, DataTypes);
const Student = require('./student.model')(sequelize, DataTypes);
const Teacher = require('./teacher.model')(sequelize, DataTypes);
const User = require('./user.model')(sequelize, DataTypes);
const Admin = require('./admin.model')(sequelize, DataTypes);
const NoteCategory = require('./note_category.model')(sequelize, DataTypes);
const NoteTag = require('./note_tag.model')(sequelize, DataTypes);
const NoteTagMap = require('./note_tag_map.model')(sequelize, DataTypes);
const Note = require('./note.model')(sequelize, DataTypes);

// -------------------- Associations --------------------

// User - Role
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

// User - Student / Teacher / Staff / Admin (one user -> one profile of each type)
Student.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Student, { foreignKey: 'user_id' });

Teacher.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Teacher, { foreignKey: 'user_id' });

Staff.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Staff, { foreignKey: 'user_id' });

Admin.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Admin, { foreignKey: 'user_id' });

// Student relations
Student.belongsTo(Major, { foreignKey: 'major_id' });
Major.hasMany(Student, { foreignKey: 'major_id' });

Student.belongsTo(OfficeClass, { foreignKey: 'office_class_id' });
OfficeClass.hasMany(Student, { foreignKey: 'office_class_id' });

Student.belongsTo(AcademicYear, { foreignKey: 'academic_year_id' });
AcademicYear.hasMany(Student, { foreignKey: 'academic_year_id' });

// Semester is standalone (no direct FK to AcademicYear)

// Parent - Student
ParentStudent.belongsTo(Student, { foreignKey: 'student_id' });
Student.hasMany(ParentStudent, { foreignKey: 'student_id' });

// OfficeClass relations
OfficeClass.belongsTo(Teacher, { foreignKey: 'teacher_id' });
Teacher.hasMany(OfficeClass, { foreignKey: 'teacher_id' });

OfficeClass.belongsTo(AcademicYear, { foreignKey: 'academic_year_id' });
AcademicYear.hasMany(OfficeClass, { foreignKey: 'academic_year_id' });

// OfficeClass - Major (added to support major_id on OfficeClass)
OfficeClass.belongsTo(Major, { foreignKey: 'major_id' });
Major.hasMany(OfficeClass, { foreignKey: 'major_id' });

// Teacher relations
Teacher.belongsTo(AcademicDegree, { foreignKey: 'academic_degree_id' });
AcademicDegree.hasMany(Teacher, { foreignKey: 'academic_degree_id' });

Teacher.belongsTo(Position, { foreignKey: 'position_id' });
Position.hasMany(Teacher, { foreignKey: 'position_id' });


// -------------------- Init Database & Seed --------------------
// -------------------- Note models & relations --------------------
NoteCategory.hasMany(Note, { foreignKey: 'note_category_id' });
Note.belongsTo(NoteCategory, { foreignKey: 'note_category_id' });

// User - Note (use DB column user_id on notes, mapped from note_user_id attribute)
Note.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Note, { foreignKey: 'user_id' });

// Note <-> Tag (many-to-many) using NoteTagMap columns (note_tag_map_note_id, note_tag_map_note_tag_id)
Note.belongsToMany(NoteTag, { through: { model: NoteTagMap, unique: 'uniq_ntm' }, foreignKey: 'note_id', otherKey: 'note_tag_id' });
NoteTag.belongsToMany(Note, { through: { model: NoteTagMap, unique: 'uniq_ntm' }, foreignKey: 'note_tag_id', otherKey: 'note_id' });

NoteTag.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(NoteTag, { foreignKey: 'user_id' });

// messages model removed as chat feature no longer used
const initDb = async () => {
  try {
    // Sync DB, alter bảng nếu cần
    await sequelize.sync({ alter: false });

    // Seed role an toàn: chỉ seed khi chưa có dữ liệu
    const roleCount = await Role.count();
    if (roleCount === 0) {
      await Role.seedDefaultRoles();
      console.log('Default roles seeded.');
    }

    // Seed academic degrees (mặc định cứng) nếu chưa có
    const degreeCount = await AcademicDegree.count();
    if (degreeCount === 0) {
      await AcademicDegree.seedDefaults();
      console.log('Default academic degrees seeded.');
    }

    // Seed positions (mặc định cứng) nếu chưa có
    const positionCount = await Position.count();
    if (positionCount === 0) {
      await Position.seedDefaults();
      console.log('Default positions seeded.');
    }

    // Seed note categories (mặc định) nếu chưa có
    const noteCategoryCount = await NoteCategory.count();
    if (noteCategoryCount === 0) {
      await NoteCategory.seedDefault();
      console.log('Default note categories seeded.');
    }
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
};

// -------------------- Export --------------------
const models = {
  AcademicDegree,
  AcademicYear,
  Semester,
  Major,
  OfficeClass,
  ParentStudent,
  Position,
  Role,
  Staff,
  Student,
  Teacher,
  User,
  Admin,
  NoteCategory,
  NoteTag,
  NoteTagMap,
  Note,
  // Message removed
};

module.exports = { sequelize, models, initDb };
