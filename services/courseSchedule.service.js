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

module.exports = { listCourseSchedules, getCourseSchedule, createCourseSchedule, updateCourseSchedule, deleteCourseSchedule };
