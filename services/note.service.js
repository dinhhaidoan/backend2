const { sequelize, models } = require('../models/index.model');
const { Note, NoteTag, NoteTagMap, NoteCategory, User } = models;

// helper
const pick = (obj = {}, keys = []) => {
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
};

/**
 * Upsert tags for a user. Accepts array of tag strings.
 * Returns array of NoteTag instances.
 */
const upsertTagsForUser = async (user_id, tagNames = [], t) => {
  const out = [];
  for (const raw of tagNames || []) {
    const name = String(raw || '').trim();
    if (!name) continue;
    // try find existing
    let tag = await NoteTag.findOne({ where: { note_tag_user_id: user_id, note_tag_name: name }, transaction: t });
    if (!tag) {
      try {
        tag = await NoteTag.create({ note_tag_name: name, note_tag_user_id: user_id }, { transaction: t });
      } catch (err) {
        // race: fallback to find
        tag = await NoteTag.findOne({ where: { note_tag_user_id: user_id, note_tag_name: name }, transaction: t });
      }
    }
    if (tag) out.push(tag);
  }
  return out;
};

const createNote = async ({ note: noteData = {}, tags = [], user_code } = {}) => {
  if (!noteData || !noteData.note_title) throw new Error('Vui lòng cung cấp note_title');

  return await sequelize.transaction(async (t) => {
    // resolve user_id
    let userId = noteData.note_user_id;
    if (!userId) {
      if (!user_code) throw new Error('Thiếu user_code hoặc note_user_id');
      const user = await User.findOne({ where: { user_code }, transaction: t });
      if (!user) throw new Error('User không tồn tại');
      userId = user.user_id;
    }

    const allowed = ['note_title','note_content','note_user_id','note_category_id','note_status','note_priority','note_is_favorite','note_is_archived','note_created_at','note_updated_at'];
    const payload = pick(noteData, allowed);
    payload.note_user_id = userId;

    // normalize boolean fields if front-end sent strings
    if (payload.note_is_favorite !== undefined) {
      if (typeof payload.note_is_favorite === 'string') payload.note_is_favorite = payload.note_is_favorite === 'true' || payload.note_is_favorite === '1';
      else payload.note_is_favorite = !!payload.note_is_favorite;
    }
    if (payload.note_is_archived !== undefined) {
      if (typeof payload.note_is_archived === 'string') payload.note_is_archived = payload.note_is_archived === 'true' || payload.note_is_archived === '1';
      else payload.note_is_archived = !!payload.note_is_archived;
    }

    const newNote = await Note.create(payload, { transaction: t });

    // handle tags
    const tagInstances = await upsertTagsForUser(userId, tags, t);
    for (const tag of tagInstances) {
      await NoteTagMap.create({ note_tag_map_note_id: newNote.note_id, note_tag_map_note_tag_id: tag.note_tag_id }, { transaction: t });
    }

    // return note with includes
    const note = await Note.findOne({ where: { note_id: newNote.note_id }, include: [NoteCategory, NoteTag], transaction: t });
    return note;
  });
};

const getNotes = async ({ user_code, user_id, tag, category_id, status, priority, favorite, archived, page = 1, limit = 20 } = {}) => {
  const where = {};
  // normalize numeric and boolean query params to avoid passing strings into Sequelize
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 20;
  if (limit <= 0) limit = 20;
  // normalize booleans that may come as strings
  if (typeof favorite === 'string') favorite = favorite === 'true' || favorite === '1';
  if (typeof archived === 'string') archived = archived === 'true' || archived === '1';
  // normalize ids
  const parsedUserId = user_id ? parseInt(user_id, 10) : null;
  const parsedCategoryId = category_id ? parseInt(category_id, 10) : null;
  if (parsedUserId && !Number.isNaN(parsedUserId)) where.note_user_id = parsedUserId;
  if (status) where.note_status = status;
  if (priority) where.note_priority = priority;
  if (favorite !== undefined) where.note_is_favorite = favorite;
  if (archived !== undefined) where.note_is_archived = archived;
  if (parsedCategoryId && !Number.isNaN(parsedCategoryId)) where.note_category_id = parsedCategoryId;

  // resolve user_code -> user_id if provided
  if (user_code && !where.note_user_id) {
    const u = await User.findOne({ where: { user_code } });
    if (u) where.note_user_id = u.user_id;
  }

  const include = [NoteCategory, { model: NoteTag }];

  const offset = (Math.max(1, page) - 1) * limit;

  // if filter by tag string
  if (tag) {
    // find tag ids for current user if possible
    const tagWhere = { note_tag_name: tag };
    if (where.note_user_id) tagWhere.note_tag_user_id = where.note_user_id;
    const tagObj = await NoteTag.findOne({ where: tagWhere });
    if (!tagObj) return { rows: [], count: 0 };
    // join through mapping
    // when filtering by tag we need to join tag mapping; request rows and count separately via Sequelize
    const notes = await Note.findAndCountAll({
      where,
      // include NoteCategory and restrict NoteTag by tagObj
      include: [NoteCategory, { model: NoteTag, where: { note_tag_id: tagObj.note_tag_id } }],
      offset,
      limit,
      distinct: true,
      subQuery: false,
      includeIgnoreAttributes: false,
      order: [['note_updated_at','DESC']]
    });
    return notes;
  }

  const notes = await Note.findAndCountAll({ where, include, offset, limit, order: [['note_updated_at','DESC']], distinct: true });
  return notes;
};

const getNoteById = async (note_id) => {
  if (!note_id) throw new Error('Missing note_id');
  const note = await Note.findOne({ where: { note_id }, include: [NoteCategory, NoteTag] });
  if (!note) throw new Error('Note not found');
  return note;
};

const updateNote = async (note_id, { note: noteData = {}, tags } = {}) => {
  if (!note_id) throw new Error('Missing note_id');

  return await sequelize.transaction(async (t) => {
    const existing = await Note.findOne({ where: { note_id }, transaction: t });
    if (!existing) throw new Error('Note not found');

    const allowed = ['note_title','note_content','note_category_id','note_status','note_priority','note_is_favorite','note_is_archived','note_updated_at'];
    const payload = pick(noteData, allowed);
    // normalize boolean fields that might be sent as strings
    if (payload.note_is_favorite !== undefined) {
      if (typeof payload.note_is_favorite === 'string') payload.note_is_favorite = payload.note_is_favorite === 'true' || payload.note_is_favorite === '1';
      else payload.note_is_favorite = !!payload.note_is_favorite;
    }
    if (payload.note_is_archived !== undefined) {
      if (typeof payload.note_is_archived === 'string') payload.note_is_archived = payload.note_is_archived === 'true' || payload.note_is_archived === '1';
      else payload.note_is_archived = !!payload.note_is_archived;
    }

    // ensure updated_at is set
    if (!payload.note_updated_at) payload.note_updated_at = new Date();

    if (Object.keys(payload).length) await Note.update(payload, { where: { note_id }, transaction: t });

    if (Array.isArray(tags)) {
      // resolve owner
      const ownerId = existing.note_user_id;
      const tagInstances = await upsertTagsForUser(ownerId, tags, t);
      const newTagIds = tagInstances.map(x => x.note_tag_id);
      const existingMaps = await NoteTagMap.findAll({ where: { note_tag_map_note_id: note_id }, transaction: t });
      const existingTagIds = existingMaps.map(m => m.note_tag_map_note_tag_id);
      const toAdd = newTagIds.filter(id => !existingTagIds.includes(id));
      const toRemove = existingTagIds.filter(id => !newTagIds.includes(id));
      for (const id of toAdd) await NoteTagMap.create({ note_tag_map_note_id: note_id, note_tag_map_note_tag_id: id }, { transaction: t });
      if (toRemove.length) await NoteTagMap.destroy({ where: { note_tag_map_note_id: note_id, note_tag_map_note_tag_id: toRemove }, transaction: t });
    }

    const note = await Note.findOne({ where: { note_id }, include: [NoteCategory, NoteTag], transaction: t });
    return note;
  });
};

const deleteNote = async (note_id) => {
  if (!note_id) throw new Error('Missing note_id');
  return await sequelize.transaction(async (t) => {
    // delete mappings
    await NoteTagMap.destroy({ where: { note_tag_map_note_id: note_id }, transaction: t });
    await Note.destroy({ where: { note_id }, transaction: t });
    return { message: 'Deleted', note_id };
  });
};

/**
 * Return categories summary for a user: count of unique notes per category.
 * Accepts { user_code, user_id }
 */
const getCategoriesSummary = async ({ user_code, user_id } = {}) => {
  // resolve user_id if user_code provided
  let uid = user_id;
  if (!uid && user_code) {
    const u = await User.findOne({ where: { user_code } });
    if (u) uid = u.user_id;
  }

  const where = {};
  if (uid) where.note_user_id = uid;

  // Use Sequelize aggregation with COUNT(DISTINCT note_id) to avoid inflated counts from JOINs
  const rows = await Note.findAll({
    attributes: [
      [sequelize.fn('COALESCE', sequelize.col('Note.note_category_id'), null), 'note_category_id'],
      [sequelize.literal('COUNT(DISTINCT `Note`.`note_id`)'), 'count']
    ],
    where,
    include: [{ model: NoteCategory, attributes: ['note_category_id', 'note_category_name'] }],
    // group by actual DB columns: Note.note_category_id and NoteCategory.name (NoteCategory.note_category_name maps to DB column `name`)
    group: [sequelize.col('Note.note_category_id'), sequelize.col('NoteCategory.name')],
    order: [[sequelize.literal('count'), 'DESC']]
  });

  return rows.map(r => ({
    note_category_id: r.get('note_category_id'),
    note_category_name: r.NoteCategory ? r.NoteCategory.note_category_name : null,
    count: parseInt(r.get('count'), 10)
  }));
};

module.exports = { createNote, getNotes, getNoteById, updateNote, deleteNote, getCategoriesSummary };
