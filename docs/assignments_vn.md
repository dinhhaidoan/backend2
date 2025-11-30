Tài liệu API và logic cho tính năng Bài tập (Assignment)
====================================================

Tổng quan
---------
- Model: Assignment
- Mục đích: Lưu thông tin bài tập cho một lớp (CourseClass). Hỗ trợ 3 loại bài: `essay` (tự luận), `mcq` (trắc nghiệm), `mixed`.
- Quan hệ: Assignment -> CourseClass; Assignment -> AssignmentQuestion -> AssignmentQuestionOption (cho MCQ)

Endpoints
---------
- GET /api/share/assignments?course_class_id=&teacher_code=&page=&limit=  -> List bài tập
- GET /api/share/assignments/:assignment_id -> Get chi tiết 1 bài tập cùng câu hỏi và đáp án
- POST /api/share/assignments -> Tạo bài tập (auth required) (teacher owner hoặc admin/staff)
- PATCH /api/share/assignments/:assignment_id -> Cập nhật (auth required)
- DELETE /api/share/assignments/:assignment_id -> Xóa (auth required)

Fields chính
-------------
- assignment_id: primary key
- assignment_title: string (required)
- course_class_id: integer (required)
- assignment_type: enum: 'essay', 'mcq', 'mixed' (required)
- assignment_due_date: ISO date (optional)
- assignment_max_score: number (optional) — điểm tối đa bài tập
- assignment_description: text (optional)
- questions: array of object
  - assignment_question_id: (sẽ được DB tạo)
  - question_type: 'essay' | 'mcq'
  - question_content: string (required)
  - question_points: number (optional) — nếu không có và assignment_max_score có, hệ thống chia đều
  - options: array of option objects (chỉ cho MCQ)
    - option_text: string
    - option_is_correct: boolean (chỉ 1 đáp án đúng)

Quy ước FE (Input) cho POST / PATCH
----------------------------------
- POST /api/share/assignments
  {
    "assignment_title": "Bài tập số 1",
    "course_class_id": 12,
    "assignment_type": "mixed",
    "assignment_due_date": "2025-12-15T23:59:00.000Z",
    "assignment_max_score": 10, // optional
    "assignment_description": "Mô tả ...",
    "questions": [
      { "question_type": "essay", "question_content": "Viết 1 bài ngắn..." },
      { "question_type": "mcq", "question_content": "Câu hỏi A?", "options": [ { "option_text": "A", "option_is_correct": false }, { "option_text": "B", "option_is_correct": true } ] }
    ]
  }

 - Nếu FE nhập `assignment_max_score` và không nhập `question_points`, hệ thống tự chia đều cho các câu hỏi không có `question_points`. FE vẫn có thể tính sẵn trên UI, nhưng BE sẽ enforce distribution if needed.
 - Nếu các `question_points` được cung cấp, BE sẽ dùng giá trị đó và kiểm tra tổng không vượt quá `assignment_max_score` (nếu `assignment_max_score` có). Nếu tổng lớn hơn `assignment_max_score`, BE trả lỗi.

Output mẫu
-----------
- POST thành công: HTTP 201:
  {
    "message": "Assignment created",
    "assignment": { assignment object with nested AssignmentQuestion and AssignmentQuestionOption }
  }
- GET list: Sequelize findAndCountAll format: { rows: [..], count: N }
- GET detail: { assignment: { ... } }
- Lỗi: 400/401/403/404 theo tình huống (validation/unauthorized/forbidden/not found)

Validation chính
-----------------
- `assignment_title`: required non-empty
- `course_class_id`: positive integer exists in DB
- `assignment_type`: one of 'essay','mcq','mixed'
- For MCQ questions: must have options array and exactly one option with `option_is_correct = true`.
- For question_points: must be number > 0 if present
- `assignment_max_score`: number > 0 if present; sum(question_points) must not exceed it

Flow FE đề xuất
----------------
1) FE hiển thị danh sách lớp của GV (teacher_code) để chọn `course_class_id`.
2) Tạo bài: Frontend build questions array UI, cung cấp points per question or let BE distribute via `assignment_max_score`.
3) Lấy list: GET /api/share/assignments?course_class_id=12
4) Lấy chi tiết & hiển thị question + options
5) Sửa (PATCH) hoặc Xóa (DELETE) theo quyền

Ghi chú triển khai
------------------
- Tôi đã cấu trúc DB theo mô hình: Assignment -> AssignmentQuestion -> AssignmentQuestionOption
- Toàn bộ CRUD thực hiện trong transaction; việc cập nhật questions sẽ replace toàn bộ câu hỏi (xóa + tạo mới). Nếu muốn update từng câu hỏi bạn có thể đề xuất thêm endpoint partial update cho question/option.
- Nếu muốn extensible: thêm thuộc tính `weight` hoặc `order` cho câu hỏi để sắp xếp.
