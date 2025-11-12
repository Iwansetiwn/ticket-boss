-- Allow storing long external avatar URLs/Base64 strings
ALTER TABLE `User`
  MODIFY COLUMN `avatarUrl` TEXT NULL;
