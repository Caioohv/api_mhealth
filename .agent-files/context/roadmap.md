# Roadmap - Unified Agenda & Dashboard Improvements

### 1. Vision Statement
Implement a consolidated agenda system to provide patients and caregivers with a comprehensive weekly and daily view of all health appointments and medication schedules.

### 2. Roadmap Phases

#### Phase 1: Agenda Foundation & Utilities
- **Goal**: Create the core logic to expand recurring medication schedules into specific instances for any date range.
- **Key Components**: `agendaUtils.js` helper.
- **Dependencies**: None.

#### Phase 2: Unified Agenda Endpoint
- **Goal**: Implement the API endpoint that aggregates consultations and expanded medication instances.
- **Key Components**: `getAgenda` in `DashboardController` and `DashboardService`.
- **Dependencies**: Phase 1.

#### Phase 3: Dashboard Refinement
- **Goal**: Upgrade existing dashboard logic to show a full day's worth of medications instead of just "upcoming" ones.
- **Key Components**: Refactor `getPatientDashboard`.
- **Dependencies**: Phase 1.

#### Phase 4: Weekly Grouping
- **Goal**: Ensure the agenda and consultations lists support grouping and filtering by week.
- **Key Components**: Controller query logic.
- **Dependencies**: Phase 2.

### 3. Architecture & Standards Alignment
This roadmap follows the existing Service/Controller pattern. It uses `date-fns` for consistency and respects the network-based isolation logic.

### 4. Success Criteria
- [ ] `agendaUtils` correctly handles daily and hourly recurrences.
- [ ] `GET /agenda` returns structured data grouped by date.
- [ ] `GET /dashboard/patient` shows all medications for the current day.
- [ ] Integration tested with real database data.
