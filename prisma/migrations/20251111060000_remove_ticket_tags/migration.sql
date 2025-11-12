-- Drop tags column and add ticketUrl captured by the Chrome extension
ALTER TABLE `Ticket`
  DROP COLUMN `tags`,
  ADD COLUMN `ticketUrl` VARCHAR(191) NULL;
