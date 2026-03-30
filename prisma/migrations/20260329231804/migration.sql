-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `googleId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_googleId_key`(`googleId`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportNetwork` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NetworkMember` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `networkId` VARCHAR(191) NOT NULL,
    `role` ENUM('RESPONSAVEL', 'ASSISTIDO') NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `medicationAccess` ENUM('NONE', 'VIEW', 'EDIT') NOT NULL DEFAULT 'NONE',
    `consultationAccess` ENUM('NONE', 'VIEW', 'EDIT') NOT NULL DEFAULT 'NONE',
    `networkAccess` ENUM('NONE', 'VIEW', 'EDIT') NOT NULL DEFAULT 'NONE',
    `recordsAccess` ENUM('NONE', 'VIEW', 'EDIT') NOT NULL DEFAULT 'NONE',
    `alertLevel` ENUM('ALL', 'EMERGENCY_ONLY', 'NONE') NOT NULL DEFAULT 'ALL',

    UNIQUE INDEX `NetworkMember_userId_networkId_key`(`userId`, `networkId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invitation` (
    `id` VARCHAR(191) NOT NULL,
    `networkId` VARCHAR(191) NOT NULL,
    `inviterId` VARCHAR(191) NOT NULL,
    `invitedEmail` VARCHAR(191) NULL,
    `invitedPhone` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `token` VARCHAR(191) NOT NULL,
    `proposedRole` ENUM('RESPONSAVEL', 'ASSISTIDO') NOT NULL,
    `medicationAccess` ENUM('NONE', 'VIEW', 'EDIT') NOT NULL DEFAULT 'NONE',
    `consultationAccess` ENUM('NONE', 'VIEW', 'EDIT') NOT NULL DEFAULT 'NONE',
    `networkAccess` ENUM('NONE', 'VIEW', 'EDIT') NOT NULL DEFAULT 'NONE',
    `recordsAccess` ENUM('NONE', 'VIEW', 'EDIT') NOT NULL DEFAULT 'NONE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invitation_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Medication` (
    `id` VARCHAR(191) NOT NULL,
    `networkId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `dosage` VARCHAR(191) NOT NULL,
    `needsBuy` BOOLEAN NOT NULL DEFAULT false,
    `instructions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicationSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `medicationId` VARCHAR(191) NOT NULL,
    `intervalHours` INTEGER NULL,
    `intervalDays` INTEGER NULL,
    `specificTimes` JSON NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicationIntake` (
    `id` VARCHAR(191) NOT NULL,
    `medicationId` VARCHAR(191) NOT NULL,
    `takenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `registeredBy` VARCHAR(191) NOT NULL,
    `status` ENUM('TAKEN', 'MISSED', 'LATE') NOT NULL,
    `notes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Consultation` (
    `id` VARCHAR(191) NOT NULL,
    `networkId` VARCHAR(191) NOT NULL,
    `type` ENUM('CONSULTA', 'PROCEDIMENTO') NOT NULL DEFAULT 'CONSULTA',
    `title` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `doctorName` VARCHAR(191) NULL,
    `specialty` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Occurrence` (
    `id` VARCHAR(191) NOT NULL,
    `networkId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `type` ENUM('QUEDA', 'MAL_ESTAR', 'OBSERVACAO') NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `registeredBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Habit` (
    `id` VARCHAR(191) NOT NULL,
    `networkId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `frequency` ENUM('DAILY', 'WEEKLY', 'CUSTOM') NOT NULL,
    `goal` INTEGER NULL,
    `unit` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HabitRecord` (
    `id` VARCHAR(191) NOT NULL,
    `habitId` VARCHAR(191) NOT NULL,
    `registeredBy` VARCHAR(191) NOT NULL,
    `value` INTEGER NULL,
    `notes` TEXT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmergencyAlert` (
    `id` VARCHAR(191) NOT NULL,
    `networkId` VARCHAR(191) NOT NULL,
    `triggeredBy` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `status` ENUM('ACTIVE', 'RESOLVED', 'CANCELED') NOT NULL DEFAULT 'ACTIVE',
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SupportNetwork` ADD CONSTRAINT `SupportNetwork_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NetworkMember` ADD CONSTRAINT `NetworkMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NetworkMember` ADD CONSTRAINT `NetworkMember_networkId_fkey` FOREIGN KEY (`networkId`) REFERENCES `SupportNetwork`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_networkId_fkey` FOREIGN KEY (`networkId`) REFERENCES `SupportNetwork`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medication` ADD CONSTRAINT `Medication_networkId_fkey` FOREIGN KEY (`networkId`) REFERENCES `SupportNetwork`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationSchedule` ADD CONSTRAINT `MedicationSchedule_medicationId_fkey` FOREIGN KEY (`medicationId`) REFERENCES `Medication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationIntake` ADD CONSTRAINT `MedicationIntake_medicationId_fkey` FOREIGN KEY (`medicationId`) REFERENCES `Medication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationIntake` ADD CONSTRAINT `MedicationIntake_registeredBy_fkey` FOREIGN KEY (`registeredBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consultation` ADD CONSTRAINT `Consultation_networkId_fkey` FOREIGN KEY (`networkId`) REFERENCES `SupportNetwork`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Occurrence` ADD CONSTRAINT `Occurrence_networkId_fkey` FOREIGN KEY (`networkId`) REFERENCES `SupportNetwork`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Occurrence` ADD CONSTRAINT `Occurrence_registeredBy_fkey` FOREIGN KEY (`registeredBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Habit` ADD CONSTRAINT `Habit_networkId_fkey` FOREIGN KEY (`networkId`) REFERENCES `SupportNetwork`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabitRecord` ADD CONSTRAINT `HabitRecord_habitId_fkey` FOREIGN KEY (`habitId`) REFERENCES `Habit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabitRecord` ADD CONSTRAINT `HabitRecord_registeredBy_fkey` FOREIGN KEY (`registeredBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyAlert` ADD CONSTRAINT `EmergencyAlert_networkId_fkey` FOREIGN KEY (`networkId`) REFERENCES `SupportNetwork`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyAlert` ADD CONSTRAINT `EmergencyAlert_triggeredBy_fkey` FOREIGN KEY (`triggeredBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
