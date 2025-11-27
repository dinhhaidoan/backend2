const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const AcademicDegree = require('./academic_degree.model')(sequelize, DataTypes);
const AcademicYear = require('./academic_year.model')(sequelize, DataTypes);
const Semester = require('./semester.model')(sequelize, DataTypes);
const Major = require('./majo.model')(sequelize, DataTypes);
const OfficeClass = require('./office_class.model')(sequelize, DataTypes);
const Course = require('./course.model')(sequelize, DataTypes);
const CourseMajor = require('./course_major.model')(sequelize, DataTypes);
const CoursePrerequisite = require('./course_prerequisite.model')(sequelize, DataTypes);
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
const Base = require('./base.model')(sequelize, DataTypes);
const Floor = require('./floor.model')(sequelize, DataTypes);
const Room = require('./room.model')(sequelize, DataTypes);

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

// Course relations - Course is the program entry; will be used by future Course/Class models
Course.belongsTo(Semester, { foreignKey: 'semester_id' });
Semester.hasMany(Course, { foreignKey: 'semester_id' });

// Course <-> Major (many-to-many)
Course.belongsToMany(Major, { through: { model: CourseMajor, unique: 'uniq_cm' }, foreignKey: 'course_id', otherKey: 'major_id' });
Major.belongsToMany(Course, { through: { model: CourseMajor, unique: 'uniq_cm' }, foreignKey: 'major_id', otherKey: 'course_id' });

// Course prerequisites (self-referential many-to-many)
Course.belongsToMany(Course, { as: 'Prerequisites', through: { model: CoursePrerequisite, unique: 'uniq_cp' }, foreignKey: 'course_id', otherKey: 'prereq_course_id' });
Course.belongsToMany(Course, { as: 'IsPrerequisiteFor', through: { model: CoursePrerequisite, unique: 'uniq_cp' }, foreignKey: 'prereq_course_id', otherKey: 'course_id' });

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

// Base / Floor / Room relations
Base.hasMany(Floor, { foreignKey: 'base_id' });
Floor.belongsTo(Base, { foreignKey: 'base_id' });

Floor.hasMany(Room, { foreignKey: 'floor_id' });
Room.belongsTo(Floor, { foreignKey: 'floor_id' });

Base.hasMany(Room, { foreignKey: 'base_id' });
Room.belongsTo(Base, { foreignKey: 'base_id' });

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

    // Seed bases
    const baseCount = await Base.count();
    if (baseCount === 0) {
      await Base.seedDefaults();
      console.log('Default bases seeded.');
    }

    // Seed floors
    const floorCount = await Floor.count();
    if (floorCount === 0) {
      await Floor.seedDefaults();
      console.log('Default floors seeded.');
    }

    // Seed rooms
    const roomCount = await Room.count();
    if (roomCount === 0) {
      await Room.seedDefaults();
      console.log('Default rooms seeded.');
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
  Base,
  Floor,
  Room,
  NoteCategory,
  NoteTag,
  NoteTagMap,
  Note,
  Course,
  CourseMajor,
  CoursePrerequisite,
};

module.exports = { sequelize, models, initDb };
