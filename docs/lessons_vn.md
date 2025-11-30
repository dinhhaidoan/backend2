Tài liệu API và logic cho tính năng Bài học (Lesson)
===================================================

Tổng quan
---------
- Tên model: Lesson
- Mục đích: Lưu thông tin từng buổi/bài học thuộc một lớp (CourseClass). Cho phép giảng viên/giáo vụ tạo, sửa, xóa, và liệt kê các bài học.
- Quan hệ: mỗi Lesson thuộc về một `CourseClass` (course_class_id). Mỗi Lesson có thể có nhiều link YouTube và nhiều link Drive.

Đường dẫn (Routes)
------------------
- GET /api/share/lessons                     -> Liệt kê (supports filter: course_class_id, teacher_code, page, limit)
- GET /api/share/lessons/:lesson_id          -> Lấy chi tiết 1 bài học
- POST /api/share/lessons                    -> Tạo bài học (auth required)
- PATCH /api/share/lessons/:lesson_id        -> Cập nhật bài học (auth required)
- DELETE /api/share/lessons/:lesson_id       -> Xóa bài học (auth required)

Phân quyền & xác thực
---------------------
- Tất cả thao tác tạo/sửa/xóa yêu cầu xác thực (Authorization: Bearer <JWT> hoặc cookie).
- Quyền tạo/sửa/xóa: chỉ Giảng viên chủ nhiệm lớp (theo course_class.teacher_id) hoặc Admin / Staff (role) hoặc user có cờ `is_system_manager` mới được phép.
- Lấy danh sách / chi tiết bài học không cần xác thực (tuỳ theo route thiết lập). Hiện tại endpoints list/get không yêu cầu xác thực.

Luồng tích hợp (frontend)
-------------------------
1) Lấy danh sách các lớp của giảng viên hiện tại (để FE hiển thị lựa chọn lớp) bằng `GET /api/share/course-classes?teacher_code=GVxxxxx`.
2) Khi giảng viên chọn 1 lớp, FE gọi `POST /api/share/lessons` để tạo bài học với `course_class_id` đã chọn.
3) Khi cần hiển thị tất cả bài học cho lớp, gọi `GET /api/share/lessons?course_class_id=123&page=1&limit=20`.
4) Khi giảng viên muốn sửa bài, gọi `PATCH /api/share/lessons/:lesson_id`.
5) Khi muốn xóa, gọi `DELETE /api/share/lessons/:lesson_id`.

Model & Trường chính
---------------------
- lesson_id: integer (primary key)
- lesson_title: string — Bắt buộc
- course_class_id: integer — Bắt buộc, khóa ngoại tới `course_classes.course_class_id`
- lesson_date: date (ISO string) — Bắt buộc, ngày/giờ bắt đầu buổi học
- lesson_duration_minutes: integer — Số phút (nullable)
- lesson_status: enum ['draft','published'] — Mặc định 'draft'
- lesson_description: text — Mô tả (nullable)
- lesson_meet_link: string — link Google Meet (nullable, 1 link)
- youtube_links: [] — (không lưu dưới dạng mảng trong Lesson, mà lưu qua bảng `lesson_youtube_links`) — FE: gửi mảng url
- drive_links: [] — tương tự lưu qua `lesson_drive_links`
- created_by (DB field tên `created_by`/ `created_by_user_id`) — id người tạo
- created_at, updated_at: timestamps

Quy ước dữ liệu (Input) cho FE
-------------------------------
- Create (POST /api/share/lessons) — JSON body
  {
    "course_class_id": 12,                // required
    "lesson_title": "Bài 1: Giới thiệu",
    "lesson_date": "2025-10-08T09:00:00.000Z",
    "lesson_duration_minutes": 90,        // optional
    "lesson_status": "draft",           // optional, default='draft' => 'published' / 'draft'
    "lesson_description": "Nội dung buổi học...", // optional
    "lesson_meet_link": "https://meet.google.com/xxx-xxx-xxx", // optional
    "youtube_links": [ "https://youtu.be/abc123", "https://youtu.be/def456" ], // optional
    "drive_links": [ "https://drive.google.com/file/d/..", "https://drive.google.com/file/d/..." ] // optional
  }

- Update (PATCH /api/share/lessons/:lesson_id)
  - Chỉ cần gửi những trường muốn cập nhật (partial update).
  - Nếu gửi `youtube_links` hoặc `drive_links` (mảng), backend sẽ xóa entries cũ và thay bằng mảng mới (replace).
  - Ví dụ: 
  {
    "lesson_title": "Bài 1 — Cập nhật",
    "lesson_status": "published",
    "youtube_links": ["https://youtu.be/ghi789"]
  }

Output (Response): JSON
------------------------
- Tạo thành công (HTTP 201)
  {
    "message": "Lesson created",
    "lesson": {
      "lesson_id": 1,
      "lesson_title": "Bài 1: ...",
      "course_class_id": 12,
      "lesson_date": "2025-10-08T09:00:00.000Z",
      "lesson_duration_minutes": 90,
      "lesson_status": "draft",
      "lesson_description": "...",
      "lesson_meet_link": "https://meet...",
      "created_by": 42,
      "created_at": "2025-10-01T...",
      "updated_at": null,
      "LessonYoutubeLinks": [ { "lesson_youtube_id": 1, "url":"https://youtu.be/abc123" }, ... ],
      "LessonDriveLinks": [ { "lesson_drive_id": 1, "url": "https://drive..." }, ... ]
    }
  }

- Lấy danh sách (HTTP 200) -> Sequelize findAndCountAll format:
  {
    "rows": [ { lesson1 }, { lesson2 }, ... ],
    "count": 42
  }

- Lấy chi tiết (HTTP 200)
  { "lesson": { lesson object (with LessonYoutubeLinks and LessonDriveLinks) } }

- Xử lý lỗi (common):
  - 400: Validation (ví dụ thiếu `lesson_title`, `course_class_id`, `lesson_date`)
  - 401: Unauthorized (không cung cấp token hoặc token không hợp lệ)
  - 403: Forbidden (user không có quyền tạo/sửa/xóa bài học cho lớp này)
  - 404: CourseClass or Lesson not found

Validation rules (tóm tắt)
--------------------------
- `course_class_id`: phải là integer và tồn tại (CourseClass phải có trong DB)
- `lesson_title`: non-empty string
- `lesson_date`: ISO date (string) — backend gọi `new Date()` nên chuỗi ISO hợp lệ
- `lesson_duration_minutes`: integer hoặc null
- `lesson_status`: 'draft' hoặc 'published'
- `youtube_links` / `drive_links` (nếu có): mảng string URL. Không có giới hạn số phần tử mặc định.

Flow front-end đề xuất
---------------------
- Lấy danh sách lớp của giáo viên: `GET /api/share/course-classes?teacher_code=GVxxx` (FE có thể hiển thị select)
- Khi giáo viên chọn `course_class_id`, tạo bài học với payload như trên.
- Hiển thị danh sách bài học: `GET /api/share/lessons?course_class_id={id}&page=1&limit=20`.
- Cập nhật bài học: `PATCH /api/share/lessons/:lesson_id` — dùng body partial.
- Xóa bài học: `DELETE /api/share/lessons/:lesson_id`.

Ví dụ cURL
-----------
- Tạo bài học (hoạt động cho FE dưới dạng POST request):
```
curl -X POST 'http://localhost:3000/api/share/lessons' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "course_class_id": 12,
    "lesson_title": "Bài 1",
    "lesson_date": "2025-10-08T09:00:00.000Z",
    "youtube_links": ["https://youtu.be/abc123"],
    "drive_links": ["https://drive.google.com/file/d/..."]
  }'
```

Tips cho FE
-----------
- Nếu FE dùng DatePicker, hãy gửi `lesson_date` dưới dạng ISO 8601 (UTC hoặc kèm timezone) để backend dễ parse.
- Nếu muốn hiển thị dung lượng hay thẻ liên kết, FE có thể lấy `LessonYoutubeLinks` và `LessonDriveLinks` từ response `lesson`.
- Nếu FE cần kiểm tra quyền trước khi hiển thị nút Tạo/Sửa/Xóa: hãy fetch `GET /api/share/course-classes?teacher_code=...` để kiểm tra `teacher_code` có lớp đó hay không. Hoặc fetch user profile (có Role & Teacher) để biết role.

Ghi chú triển khai
------------------
- Links (youtube/drive) được lưu vào bảng riêng để dễ mở rộng (ví dụ thêm `label`/`title`/`order`).
- Trường `created_by` (user_id) tự resolve từ token (nếu không gửi `created_by_user_id` trong payload) để đảm bảo tracking người tạo.
- Việc publish (thay đổi `lesson_status` sang `published`) không kích hoạt thông báo tự động ở backend (nếu cần, FE hoặc backend có thể gửi notification/email riêng).
