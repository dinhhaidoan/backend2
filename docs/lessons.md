# Lessons API

Resource: Lesson (Bài học)

Model fields (attribute names used in payloads):
- lesson_course_class_id (integer, required): Id of the related course_class
- lesson_title (string, required): Title of the lesson
- lesson_date (datetime string, required): The scheduled date/time of the lesson
- lesson_duration (integer, minutes, optional): Duration of the lesson in minutes
- lesson_status (string, default 'draft', allowed: 'published', 'draft')
- lesson_description (text, optional)
- lesson_google_meet_link (string URL, optional)

Related links (optional arrays passed alongside `lesson` object):
- youtube_links: Array[string URL] - one or more YouTube links
- drive_links: Array[string URL] - one or more Drive links

Endpoints:
- GET /api/share/lessons - List lessons. Query params: page, limit, q, course_class_id, status
- GET /api/share/lessons/:id - Get single lesson by id
- POST /api/share/lessons - Create lesson. Required: `lesson` object with course_class_id, title, date. Can include arrays `youtube_links`, `drive_links`. Requires manager-level permission.
- PATCH /api/share/lessons/:id - Update lesson. Supports replacing link arrays by sending them; also require manager permission.
- DELETE /api/share/lessons/:id - Delete lesson. Requires manager permission.

Notes:
- Links are stored in two separate tables: `lesson_youtube_links` and `lesson_drive_links`. Each record has `label` (optional) and `url` fields.
- Google Meet link is stored on the `lessons` table as single value.
- All changes to lessons and their links are performed inside transactions to ensure consistency.

Examples:
- Create lesson payload:
```
{
	"lesson": {
		"lesson_course_class_id": 42,
		"lesson_title": "Buổi 1: Giới thiệu",
		"lesson_date": "2025-12-05T09:00:00.000Z",
		"lesson_duration": 90,
		"lesson_status": "published",
		"lesson_description": "Nội dung buổi 1",
		"lesson_google_meet_link": "https://meet.google.com/example"
	},
	"youtube_links": [{ "label": "Buổi ghi hình", "url": "https://youtube.com/abc" }],
	"drive_links": [{ "label": "Tài liệu buổi 1", "url": "https://drive.google.com/drive/folders/abc" }]
}
```

 - Update lesson (replace links):
```
PATCH /api/share/lessons/12
{
	"lesson": { "lesson_title": "Buổi 1 (Cập nhật)" },
	"youtube_links": ["https://youtube.com/changed"],
	"drive_links": []
}
```
