# Teacher (Giảng viên) API — notes for FE

This document explains how the Teacher profile is returned by the backend after the recent update.

## Important: nested fields
When you call `GET /api/share/auth/users/:user_code` (or `GET /api/share/auth/users`), the `Teacher` profile object now includes nested objects for `AcademicDegree` and `Position`.

Example response structure:

```json
{
  "user": {
    "user_id": 10,
    "user_code": "GV001",
    "user_email": "gv001@example.com",
    "Teacher": {
      "teacher_id": 7,
      "teacher_code": "GV001",
      "teacher_name": "Nguyễn Văn A",
      "academic_degree_id": 2,
      "academic_degree": {
        "academic_degree_id": 2,
        "academic_degree_name": "Tiến sĩ"
      },
      "position_id": 3,
      "position": {
        "position_id": 3,
        "position_name": "Giảng viên chính"
      }
    }
  }
}
```

FE should read `user.Teacher.academic_degree.academic_degree_name` and `user.Teacher.position.position_name` for display.

## Lookup endpoints (for form dropdowns)
- GET /api/share/auth/academic-degrees → returns `items: [{ academic_degree_id, academic_degree_name }, ...]`
- GET /api/share/auth/positions → returns `items: [{ position_id, position_name }, ...]`

Use these for building dropdowns and mapping ids.

## Teachers list endpoint (server-side filtered / paginated)
- GET /api/share/auth/teachers
- Query params:
  - page (optional, default 1)
  - limit (optional, default 20)
  - q (optional, search string matching user_code, user_email, teacher_name, teacher_code)

Response format:
```json
{
  "items": [ /* array of user objects (with Teacher nested, including academic_degree and position) */ ],
  "total": 123,
  "page": 1,
  "limit": 20,
  "lastPage": 7
}
```

FE can call this endpoint to get server-side filtered/paginated lists of giảng viên.

---

If you want, I can also add a dedicated `GET /api/share/teachers` endpoint that returns only users with role=Giảng viên and supports paging/filters. Let me know.