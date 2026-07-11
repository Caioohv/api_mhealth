-- AlterTable: add attendanceStatus column to Consultation
ALTER TABLE `Consultation` ADD COLUMN `attendanceStatus` ENUM('PENDING', 'ATTENDED', 'MISSED') NOT NULL DEFAULT 'PENDING';
