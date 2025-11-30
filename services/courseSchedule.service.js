const { sequelize, models } = require('../models/index.model');
const { CourseSchedule, CourseScheduleDay, CourseScheduleSlot, CourseClass, Slot, Weekday } = models;
const { Op } = require('sequelize');

const listCourseSchedules = async ({ page = 1, limit = 20, course_class_id, schedule_type } = {}) => {
  const offset = Math.max(0, (Number(page) - 1)) * Number(limit);
  const where = {};
  if (course_class_id) where.course_class_id = Number(course_class_id);
  if (schedule_type) where.schedule_type = schedule_type;

  const result = await CourseSchedule.findAndCountAll({
    where,
    include: [
      { model: CourseScheduleDay, include: [ { model: Weekday }, { model: CourseScheduleSlot, include: [ { model: Slot } ] } ] },
      { model: CourseClass },
    ],
    limit: Number(limit),
    offset,
    order: [['schedule_id', 'DESC']],
    distinct: true,
  });

  return {
    items: result.rows,
    total: result.count,
    page: Number(page),
    limit: Number(limit),
    lastPage: Math.ceil(result.count / Number(limit) || 1),
  };
};

const getCourseSchedule = async (id) => {
  if (!id) throw new Error('Missing schedule id');
  const row = await CourseSchedule.findOne({ where: { schedule_id: id }, include: [ { model: CourseScheduleDay, include: [ { model: Weekday }, { model: CourseScheduleSlot, include: [ { model: Slot } ] } ] }, { model: CourseClass } ] });
  if (!row) throw new Error('CourseSchedule not found');
  return row;
};

// Helper: build a set of 'weekday|slot' strings from days input
const buildDaySlotSet = (days) => {
  const set = new Set();
  if (!Array.isArray(days)) return set;
  for (const d of days) {
    const weekday_id = Number(d.weekday_id);
    const slots = Array.isArray(d.slots) ? d.slots : [];
    for (const sn of slots) {
      set.add(`${weekday_id}|${Number(sn)}`);
    }
  }
  return set;
};

// Find conflicting schedules that use the same teacher_id or room_id
// days: [{ weekday_id, slots: [slotNumbers] }]
const detectScheduleConflicts = async ({ course_class_id, days, ignore_schedule_id = null } = {}) => {
  if (!course_class_id || !Array.isArray(days) || days.length === 0) return [];

  // collect candidate weekday|slot pairs
  const candidateSet = buildDaySlotSet(days);
  if (candidateSet.size === 0) return [];

  const cc = await CourseClass.findOne({ where: { course_class_id: Number(course_class_id) } });
  if (!cc) return [];
  const { teacher_id, room_id } = cc;
  if (!teacher_id && !room_id) return [];

  // load existing schedules for classes where teacher_id or room_id matches
  const whereClass = {};
  if (teacher_id) whereClass.teacher_id = teacher_id;
  // We'll check room if present separately by OR condition (Sequelize OR)
  const classWhere = {
    [Op.or]: [],
  };
  if (teacher_id) classWhere[Op.or].push({ teacher_id });
  if (room_id) classWhere[Op.or].push({ room_id });

  if (classWhere[Op.or].length === 0) return [];

  // Find CourseClass instances for these teacher/room
  const classes = await CourseClass.findAll({ where: classWhere });
  const classIds = classes.map(c => c.course_class_id);
  if (classIds.length === 0) return [];

  // Get schedules for these classes
  const scheduleWhere = { course_class_id: { [Op.in]: classIds } };
  if (ignore_schedule_id) scheduleWhere.schedule_id = { [Op.ne]: Number(ignore_schedule_id) };

  const schedules = await CourseSchedule.findAll({ where: scheduleWhere, include: [{ model: CourseScheduleDay, include: [CourseScheduleSlot] }, { model: CourseClass }] });
  const conflicts = [];
  for (const s of schedules) {
    const sc = s.toJSON ? s.toJSON() : s;
    for (const d of sc.CourseScheduleDays || []) {
      for (const slot of d.CourseScheduleSlots || []) {
        const key = `${d.weekday_id}|${slot.slot_number}`;
        if (candidateSet.has(key)) {
          conflicts.push({ schedule_id: sc.schedule_id, course_class_id: sc.course_class_id, teacher_id: sc.CourseClass && sc.CourseClass.teacher_id, room_id: sc.CourseClass && sc.CourseClass.room_id, weekday_id: d.weekday_id, slot_number: slot.slot_number });
          // do not break early; collect all conflicts
        }
      }
    }
  }
  return conflicts;
};

const createCourseSchedule = async (payload = {}) => {
  const {
    course_class_id, schedule_type = 'study', group_name = null, start_date = null, end_date = null,
    repeat_type = 'none', repeat_weeks = null, days = [],
  } = payload;
  if (!course_class_id) throw new Error('course_class_id is required');
  const cc = await CourseClass.findOne({ where: { course_class_id: Number(course_class_id) } });
  if (!cc) throw new Error('CourseClass not found');

  const t = await sequelize.transaction();
  try {
    // Check conflicts with teacher/room for the proposed days/slots
    if (days && Array.isArray(days) && days.length > 0) {
      const conflicts = await detectScheduleConflicts({ course_class_id: Number(course_class_id), days });
      if (conflicts && conflicts.length > 0) throw new Error(`Conflicts detected with existing schedules: ${conflicts.map(c => `schedule_id=${c.schedule_id}, course_class_id=${c.course_class_id}, teacher_id=${c.teacher_id}`).join('; ')}`);
    }
    const schedule = await CourseSchedule.create({ course_class_id: Number(course_class_id), schedule_type, group_name, start_date, end_date, repeat_type, repeat_weeks }, { transaction: t });

    if (days && Array.isArray(days) && days.length > 0) {
      for (const d of days) {
        const weekday_id = Number(d.weekday_id);
        if (!weekday_id) continue;
        const cday = await CourseScheduleDay.create({ schedule_id: schedule.schedule_id, weekday_id }, { transaction: t });
        const slots = Array.isArray(d.slots) ? d.slots : [];
        for (const sn of slots) {
          const slotNumber = Number(sn);
          if (!slotNumber) continue;
          const slotObj = await Slot.findOne({ where: { slot_number: slotNumber } });
          await CourseScheduleSlot.create({ day_id: cday.day_id, slot_number: slotNumber, slot_ref_id: slotObj ? slotObj.slot_id : null }, { transaction: t });
        }
      }
    }

    await t.commit();
    return await getCourseSchedule(schedule.schedule_id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * Auto generate a weekly schedule pattern from credits/weeks and preferred weekdays/slots
 * payload: { course_class_id, credits, periods_per_credit = 15, weeks, weekdays, preferred_slots, schedule_type, group_name, start_date, end_date }
 */
const autoCreateCourseSchedule = async (payload = {}) => {
  const {
    course_class_id, credits: creditsFromPayload, periods_per_credit = 15, weeks, weekdays = [], preferred_slots = [],
    schedule_type = 'study', group_name = null, start_date = null, end_date = null,
  } = payload;
  if (!course_class_id) throw new Error('course_class_id is required');
  if (!weeks || Number(weeks) < 1) throw new Error('weeks is required and must be >= 1');

  const cc = await CourseClass.findOne({ where: { course_class_id: Number(course_class_id) } });
  if (!cc) throw new Error('CourseClass not found');
  const credits = Number(creditsFromPayload || cc.credits || 0);
  if (!credits || credits <= 0) throw new Error('credits must be a positive number');

  const totalPeriods = Number(periods_per_credit) * credits;
  if (!totalPeriods || totalPeriods <= 0) throw new Error('total periods must be positive');

  // normalize weekdays default: Monday - Friday (weekday_id 1..5)
  let weekdayIds = Array.isArray(weekdays) && weekdays.length > 0 ? weekdays.map(Number).filter(n => n >= 1 && n <= 7) : [1, 2, 3, 4, 5];
  if (weekdayIds.length === 0) throw new Error('At least one weekday is required');

  // Load available slots from config
  const allSlots = await Slot.findAll({ order: [['slot_number', 'ASC']] });
  const allSlotNumbers = allSlots.map(s => s.slot_number);
  let preferredSlotNumbers = Array.isArray(preferred_slots) && preferred_slots.length > 0 ? preferred_slots.map(Number).filter(n => allSlotNumbers.includes(n)) : allSlotNumbers.slice(0, 5);

  // periods to allocate per week
  const weeksCount = Number(weeks);
  const periodsPerWeek = Math.ceil(totalPeriods / weeksCount);

  // check if available slots per week is sufficient
  const availableSlotsPerWeek = weekdayIds.length * allSlotNumbers.length; // worst-case
  const preferredAvailableSlotsPerWeek = weekdayIds.length * preferredSlotNumbers.length;
  if (periodsPerWeek > availableSlotsPerWeek) throw new Error(`Cannot schedule ${periodsPerWeek} periods/week: only ${availableSlotsPerWeek} slots/week available`);

  // distribution across weekdays: even distribution
  const basePerDay = Math.floor(periodsPerWeek / weekdayIds.length);
  let remainder = periodsPerWeek % weekdayIds.length;

  // Build days array
  const days = [];
  for (let i = 0; i < weekdayIds.length; i += 1) {
    const weekday_id = Number(weekdayIds[i]);
    let perDayCount = basePerDay + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    if (perDayCount <= 0) continue; // not needed that day

    // choose slot numbers for this day - try preferred slots first
    const slots = [];
    // Take from preferred first
    for (let j = 0; j < preferredSlotNumbers.length && slots.length < perDayCount; j += 1) {
      slots.push(preferredSlotNumbers[j]);
    }
    // If still not enough, take from allSlotNumbers
    if (slots.length < perDayCount) {
      for (let j = 0; j < allSlotNumbers.length && slots.length < perDayCount; j += 1) {
        const sn = allSlotNumbers[j];
        if (!slots.includes(sn)) slots.push(sn);
      }
    }

    days.push({ weekday_id, slots });
  }

  if (days.length === 0) throw new Error('Failed to build days for schedule (no slots chosen)');

  // Before creating, detect conflicts
  const conflicts = await detectScheduleConflicts({ course_class_id: Number(course_class_id), days });
  if (conflicts && conflicts.length > 0) throw new Error(`Conflicts detected with existing schedules: ${conflicts.map(c => `schedule_id=${c.schedule_id}, course_class_id=${c.course_class_id}, teacher_id=${c.teacher_id}`).join('; ')}`);

  // Call existing createCourseSchedule with repeat_type=custom_weeks
  const schedulePayload = {
    course_class_id: Number(course_class_id),
    schedule_type,
    group_name,
    start_date,
    end_date,
    repeat_type: 'custom_weeks',
    repeat_weeks: weeksCount,
    days,
  };

  const schedule = await createCourseSchedule(schedulePayload);
  // Return created schedule and summary
  return { schedule, summary: { requested_totalPeriods: totalPeriods, weeks: weeksCount, periods_per_week: periodsPerWeek, allocated_periods_per_week: days.reduce((acc, d) => acc + d.slots.length, 0) } };
};

const updateCourseSchedule = async (id, payload = {}) => {
  if (!id) throw new Error('Missing schedule id');
  const row = await CourseSchedule.findOne({ where: { schedule_id: id } });
  if (!row) throw new Error('CourseSchedule not found');

  const {
    course_class_id, schedule_type, group_name, start_date, end_date, repeat_type, repeat_weeks, days,
  } = payload;

  const updateFields = {};
  if (course_class_id !== undefined) updateFields.course_class_id = course_class_id;
  if (schedule_type !== undefined) updateFields.schedule_type = schedule_type;
  if (group_name !== undefined) updateFields.group_name = group_name;
  if (start_date !== undefined) updateFields.start_date = start_date;
  if (end_date !== undefined) updateFields.end_date = end_date;
  if (repeat_type !== undefined) updateFields.repeat_type = repeat_type;
  if (repeat_weeks !== undefined) updateFields.repeat_weeks = repeat_weeks;

  const t = await sequelize.transaction();
  try {
    // If days present, ensure no conflicts with other schedules (skip self schedule id for update)
    if (days && Array.isArray(days)) {
      const conflicts = await detectScheduleConflicts({ course_class_id: updateFields.course_class_id || row.course_class_id, days, ignore_schedule_id: id });
      if (conflicts && conflicts.length > 0) throw new Error(`Conflicts detected with existing schedules: ${conflicts.map(c => `schedule_id=${c.schedule_id}, course_class_id=${c.course_class_id}, teacher_id=${c.teacher_id}`).join('; ')}`);
    }
    if (Object.keys(updateFields).length > 0) await CourseSchedule.update(updateFields, { where: { schedule_id: id }, transaction: t });

    // If days present, replace all day/slot entries for this schedule
    if (days && Array.isArray(days)) {
      // Delete old day->slot hierarchy
      const oldDays = await CourseScheduleDay.findAll({ where: { schedule_id: id }, include: [CourseScheduleSlot] });
      for (const od of oldDays) {
        await CourseScheduleSlot.destroy({ where: { day_id: od.day_id }, transaction: t });
      }
      await CourseScheduleDay.destroy({ where: { schedule_id: id }, transaction: t });

      // Insert new days
      for (const d of days) {
        const weekday_id = Number(d.weekday_id);
        if (!weekday_id) continue;
        const cday = await CourseScheduleDay.create({ schedule_id: id, weekday_id }, { transaction: t });
        const slots = Array.isArray(d.slots) ? d.slots : [];
        for (const sn of slots) {
          const slotNumber = Number(sn);
          if (!slotNumber) continue;
          const slotObj = await Slot.findOne({ where: { slot_number: slotNumber } });
          await CourseScheduleSlot.create({ day_id: cday.day_id, slot_number: slotNumber, slot_ref_id: slotObj ? slotObj.slot_id : null }, { transaction: t });
        }
      }
    }

    await t.commit();
    return await getCourseSchedule(id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const deleteCourseSchedule = async (id) => {
  if (!id) throw new Error('Missing schedule id');
  const row = await CourseSchedule.findOne({ where: { schedule_id: id } });
  if (!row) throw new Error('CourseSchedule not found');

  const t = await sequelize.transaction();
  try {
    const days = await CourseScheduleDay.findAll({ where: { schedule_id: id } });
    for (const d of days) {
      await CourseScheduleSlot.destroy({ where: { day_id: d.day_id }, transaction: t });
    }
    await CourseScheduleDay.destroy({ where: { schedule_id: id }, transaction: t });
    await CourseSchedule.destroy({ where: { schedule_id: id }, transaction: t });
    await t.commit();
    return { message: 'Deleted', schedule_id: id };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

module.exports = { listCourseSchedules, getCourseSchedule, createCourseSchedule, updateCourseSchedule, deleteCourseSchedule, autoCreateCourseSchedule };
