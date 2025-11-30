# Migration: Allow NULL office_class_id + ON DELETE SET NULL

If you want `office_class_id` on the `students` table to be set to `NULL` when the referenced `office_classes` row is deleted, you need to update the DB schema as well as the server code.

This repository already updates the Sequelize models to allow the `office_class_id` column to be nullable and updated the association to `ON DELETE SET NULL`. To apply it at the DB level (MySQL), run the following SQL inside your database:

-- 1) Make the column nullable
ALTER TABLE students MODIFY COLUMN office_class_id INT NULL;

-- 2) Remove the existing foreign key constraint (change the `fk_name` to the actual name in your DB)
ALTER TABLE students DROP FOREIGN KEY fk_name_here;

-- 3) Recreate the foreign key with ON DELETE SET NULL
ALTER TABLE students ADD CONSTRAINT fk_students_office_class_id FOREIGN KEY (office_class_id) REFERENCES office_classes(office_class_id) ON DELETE SET NULL ON UPDATE CASCADE;

Replace `fk_name_here` with the actual constraint name. You can find it by running `SHOW CREATE TABLE students;` or by listing the foreign keys under `information_schema`.

Notes:
- If the project uses a migration tool (e.g., Sequelize CLI or Umzug), prefer creating a proper migration instead of running ad-hoc SQL.
- Be careful running these commands in production — back up your data beforehand.

Manual SQL also works for other database engines — adapt the syntax accordingly.

After running the migration, your updated server logic will: 
- set `office_class_id` to NULL for all impacted students when deleting an office class
- delete the office class

This ensures the client (front-end) receives a success response rather than a 400 error when deleting an office class with linked students.
