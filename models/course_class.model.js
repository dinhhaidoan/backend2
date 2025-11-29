/**
 * Model: CourseClass (Course Offering / Lớp môn học)
 * Mục đích: đại diện cho một lớp/phiên giảng của một Course (môn chính) - dùng để lưu các lớp được mở theo Course
 * - course_class_SKU: mã lớp, được tạo từ Course.course_SKU + '-' + suffix (vd: CS101-01)
 * - course_name_vn: tên môn (từ Course.course_name_vn) để hiển thị nhanh
 * - course_id: khóa ngoại tham chiếu Course
 * - semester_id: khóa ngoại tham chiếu Semester (sao chép/liên kết từ Course nếu có)
 * - teacher_id: khóa ngoại tới Teacher (giảng viên phụ trách)
 * - base_id/floor_id/room_id: lựa chọn phòng - logic hiển thị chọn Base -> Floor -> Room
 * - credits: số tín chỉ (sao chép từ Course.credits)
 * - capacity: sức chứa tối đa (số lượng sinh viên tối đa)
 * - description: mô tả lớp
 */
module.exports = (sequelize, DataTypes) => {
  const CourseClass = sequelize.define('CourseClass', {
    course_class_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_class_SKU: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    course_class_suffix: { // user provided suffix number string (like '01', '02')
      type: DataTypes.STRING,
      allowNull: true,
    },
    course_name_vn: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    semester_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    floor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    status: {
      type: DataTypes.ENUM('open', 'teaching', 'closed'),
      allowNull: false,
      defaultValue: 'open',
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'course_classes',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['course_class_SKU']
      },
    ],
  });

  return CourseClass;
};
