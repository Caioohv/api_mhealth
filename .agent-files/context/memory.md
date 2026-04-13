# Project Memory

## Recent History
- Implemented medication scheduling logic.
- Implemented dashboard and timeline services.
- Added permission checks for all major modules.

## Architectural Decisions
- Used `date-fns` for all date manipulations.
- Context-based authorization (`checkPermission` middleware).
- Unified timeline for auditing.

## Known Issues
- `dashboardService` logic for medications is currently limited to the next 24 hours only.
- Lack of a unified "Full Agenda" view.
