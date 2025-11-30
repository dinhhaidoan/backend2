Lesson API
-------------
Model: Lesson

Fields:
- course_class_id (required) - FK to course_classes
- lesson_title (required)
- lesson_date (required) - ISO date
- lesson_duration_minutes (nullable) - integer minutes
- lesson_status (draft|published)
- lesson_description (nullable)
- lesson_meet_link (nullable)
- youtube_links (nullable) - array of urls
- drive_links (nullable) - array of urls

Endpoints:
- GET /api/share/lessons : list lessons (query: course_class_id, teacher_code, page, limit)
- GET /api/share/lessons/:lesson_id : get one
- POST /api/share/lessons : create - auth required (teacher who owns the class or admin)
- PATCH /api/share/lessons/:lesson_id : update - auth required (teacher who owns the class or admin)
- DELETE /api/share/lessons/:lesson_id : delete - auth required (teacher who owns the class or admin)

Payment and other features are not supported.
