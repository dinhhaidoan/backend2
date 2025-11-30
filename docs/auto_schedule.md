Auto schedule generation

Endpoint: POST /api/share/course-schedules/auto

Body payload:
- course_class_id (required)
- weeks (required): number of weeks to teach
- credits (optional): use if you want override class credits
- periods_per_credit (optional, default 15): number of periods in a credit
- weekdays (optional): array of weekday ids [1..7] (default [1,2,3,4,5])
- preferred_slots (optional): array of slot numbers to prefer first (default [1,2,3,4,5])
- schedule_type (optional: 'study' or 'exam')
- start_date / end_date (optional): optional dates
- group_name (optional)

Behavior:
- This API computes total periods = credits * periods_per_credit.
- It computes periods_per_week = ceil(totalPeriods / weeks).
- It distributes periods_per_week evenly across specified weekdays and selects slot numbers for each day, preferring preferred_slots.
- The created schedule uses repeat_type: 'custom_weeks' and sets repeat_weeks to the given weeks count.

Response:
- course_schedule: created schedule object (CourseSchedule with days and slots)
- summary: { requested_totalPeriods, weeks, periods_per_week, allocated_periods_per_week }

Notes:
- The algorithm may allocate more total periods than requested (ceil) to make a weekly pattern; a warning is in summary.
- If periods_per_week exceeds available slots (weekday_count * total_slots), the API returns error.

Conflict detection:
- The API will also check for conflicts with existing schedules for the same `teacher` or `room`. If any overlapping day+slot already exists for another schedule where the teacher or room is the same, the API returns error listing the conflicting schedule(s). This check applies to both `POST /auto` and `POST /` (regular create) and `PATCH /:id`.

Example conflict response (HTTP 400):
```
{
	"error": "Conflicts detected with existing schedules: schedule_id=42, course_class_id=11, teacher_id=15; schedule_id=39, course_class_id=8, teacher_id=15"
}
```

Implementation notes:
- The API creates a single CourseSchedule record (repeat_type: 'custom_weeks', repeat_weeks: weeks) that describes the weekly pattern; the pattern repeats for the number of weeks.
- The system does not support irregular schedules where some weeks have fewer slots; if you need per-week differences, consider creating multiple schedule blocks.
- You can override the default periods_per_credit value if different from the assumed default (15) for your institution.

Example request (JSON body):
```
{
	"course_class_id": 123,
	"weeks": 15,
	"periods_per_credit": 15,
	"weekdays": [1,2,4],
	"preferred_slots": [1,2,3]
}
```

You can call this endpoint with a bearer token for a system manager or user with permissions.
