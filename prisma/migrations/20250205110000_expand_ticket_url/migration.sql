-- Allow full ticket URLs from support inbox captures
ALTER TABLE `Ticket`
  MODIFY COLUMN `ticketUrl` TEXT NULL;
