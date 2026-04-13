# Project Specification: mHealth API

## Overview
A mobile-first health support network for the elderly and their caregivers. Focuses on medication adherence, consultation scheduling, and emergency alerts.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MariaDB (accessed via Prisma ORM)
- **Validation**: Joi (or similar implemented in middlewares)
- **Authentication**: JWT & Google OAuth

## Core Modules
1. **Support Networks**: Logic for multiple caregivers focusing on one "Assistido".
2. **Medications**: Complex scheduling and intake tracking.
3. **Consultations**: Scheduling and reminders.
4. **Emergency**: Real-time SOS alerts.
5. **Dashboard**: "What to do now" and adherence reports.

## Key Constraints
- Multi-user permission model (RESPONSAVEL vs ASSISTIDO).
- Data must be partitioned by `SupportNetwork`.
