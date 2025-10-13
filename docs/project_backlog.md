# Restaurant Database for Tattler: Project Backlog

_Last updated: 2025-10-13_

## Summary
This backlog has been updated to reflect what we've implemented so far and the current project status. The database core (schema, import scripts, indexing, and backup procedures) is implemented. We are finishing Sprint 3 which includes geospatial support, performance optimization, and a React-based front-end proof-of-concept that will be shown at final delivery.

## User Stories with Acceptance Criteria

### User Story 1
**As a** database administrator  
**I want to** set up a MongoDB database structure  
**So that** restaurant data can be stored efficiently

**Acceptance Criteria:**
- MongoDB database created with appropriate authentication
- Collections defined with proper schema validation
- Database connection details documented
- Initial database backup created

### User Story 2
**As a** data engineer  
**I want to** import restaurant data from CSV files  
**So that** existing information is preserved in the new database system

**Acceptance Criteria:**
- Import scripts successfully parse CSV files
- All restaurant records are correctly imported into MongoDB
- Data integrity is maintained during conversion
- Script handles error cases and provides logging

### User Story 3
**As a** database administrator  
**I want to** create indexes on frequently queried fields  
**So that** database performance is optimized

**Acceptance Criteria:**
- Indexes created for name, location, and category fields
- Query performance improved by at least 30% (benchmarks documented)
- Index creation documented in the repository
- Performance benchmarks before and after indexing documented

### User Story 4
**As a** backend developer  
**I want to** design a schema that supports restaurant ratings and comments  
**So that** user feedback can be stored alongside restaurant data

**Acceptance Criteria:**
- Schema includes fields for ratings, comments, and user references
- Sample queries provided for common rating scenarios
- Schema supports aggregation of ratings
- Documentation provided on how to update and query ratings

### User Story 5
**As a** project manager  
**I want to** have a documented database backup strategy  
**So that** data is protected against potential loss

**Acceptance Criteria:**
- Backup procedures documented in the repository
- Test backup and restoration performed
- Automated backup script provided
- Verification process for backup integrity included

### User Story 6
**As a** backend developer  
**I want to** have a schema that supports geospatial queries  
**So that** users can search for restaurants by location

**Acceptance Criteria:**
- GeoJSON format implemented for location data
- Geospatial indexes created
- Example queries for finding nearby restaurants provided
- Performance testing for geospatial queries documented

### User Story 7 (New)
**As a** frontend developer / project stakeholder  
**I want to** have a React-based front-end proof of concept  
**So that** we can demonstrate user-facing functionality and integration with the API

**Acceptance Criteria:**
- Basic React app scaffolded and committed to the repository (or a separate frontend repo)
- App can list restaurants and request details from the API
- Map or location search demonstration using geospatial endpoint (basic)
- Build/run instructions included and a short demo script prepared for the final delivery

---

## Requirements Tracking Table

| Requirement ID | Requirement Description | Associated User Stories | Priority | Status |
|----------------|-------------------------|-------------------------|----------|--------|
| REQ-01 | MongoDB database setup | US1 | High | Done |
| REQ-02 | Data import from CSV | US2 | High | Done |
| REQ-03 | Database indexing strategy | US3 | Medium | Done |
| REQ-04 | Ratings and comments schema | US4 | Medium | Done |
| REQ-05 | Backup and restoration procedures | US5 | High | Done |
| REQ-06 | Geospatial query support | US6 | Low | Done (Sprint 3) |
| REQ-07 | Database documentation | US1, US3, US5 | Medium | Done |
| REQ-08 | Performance optimization | US3, US6 | Low | In Progress |
| REQ-09 | React front-end proof of concept | US7 | Medium | In Progress |

## Prioritized Requirements Table

| Stage | Requirement ID | Description | Priority | Estimated Hours | Sprint | Deliverable |
|-------|---------------|-------------|----------|-----------------|--------|-------------|
| **Setup** | REQ-01 | MongoDB database setup | High | 4 | 1 | Configured MongoDB instance |
| **Setup** | REQ-07 | Database documentation (initial) | Medium | 3 | 1 | Setup documentation in README |
| **Data Migration** | REQ-02 | Data import from CSV | High | 8 | 1 | Import scripts and verification |
| **Performance** | REQ-03 | Database indexing strategy | Medium | 5 | 2 | Indexed collections |
| **Schema Design** | REQ-04 | Ratings and comments schema | Medium | 6 | 2 | Schema documentation and examples |
| **Security** | REQ-05 | Backup and restoration procedures | High | 4 | 2 | Backup scripts and documentation |
| **Feature** | REQ-06 | Geospatial query support | Low | 7 | 3 | Geospatial indexes and query examples |
| **Optimization** | REQ-08 | Performance optimization | Low | 8 | 3 | Performance testing report (in progress) |
| **Frontend** | REQ-09 | React front-end proof of concept | Medium | 12 | 3 | React app PoC demonstrating list/detail and basic map/search |

## Definition of Done

A requirement is considered "Done" when:

1. All acceptance criteria have been met
2. Code has been reviewed
3. Documentation has been updated
4. Tests have been written and passed (where applicable)
5. A working demonstration has been provided (for backend and frontend deliverables)
6. The implementation has been committed to the repository
7. Version has been tagged according to versioning guidelines

## Sprint Planning

### Sprint 1 (Completed)
- REQ-01: MongoDB database setup **[Done]**
- REQ-07: Database documentation **[Done]**
- REQ-02: Data import from CSV **[Done]**
**Total Hours: 15**

### Sprint 2 (Completed)
- REQ-03: Database indexing strategy (5 hours) **[Done]**
- REQ-04: Ratings and comments schema (6 hours) **[Done]**
- REQ-05: Backup and restoration procedures (4 hours) **[Done]**
**Total Hours: 15**

### Sprint 3 (In Progress — finishing)
- REQ-06: Geospatial query support (7 hours) **[Done]**
- REQ-08: Performance optimization (8 hours) **[In Progress]**
- REQ-09: React front-end proof of concept (12 hours) **[In Progress]**
- Final documentation and review (5 hours)
**Total Hours: 32 (Sprint 3 work in progress)**

---

## Final Delivery / Demo Notes

- For the final delivery I will present a proof-of-concept React front-end that demonstrates:
  - Listing restaurants using GET /api/restaurants
  - Viewing restaurant details via GET /api/restaurants/{data_id}
  - Basic map or location search using GET /api/restaurants/search/location (GeoJSON point + radius)
- Include build/run instructions for the React PoC in the README or a frontend README. Example instructions (to be adapted for the actual frontend repo):
  ```bash
  git clone <frontend-repo-or-this-repo>
  cd frontend
  npm install
  # configure .env to point to API (e.g., REACT_APP_API_URL=http://localhost:3001/api)
  npm run start
  ```
- Prepare a 5-minute demo script showing:
  1. List of restaurants
  2. Click into a restaurant detail
  3. Perform a location search and show map results
  4. Close with a short note on next steps (performance improvements and tests)

## Notes, Risks and Next Actions

- Performance optimization remains in progress; expected to finish before final delivery. Prioritize slow queries identified in profiling, add necessary indexes, and add caching where appropriate.
- Ensure the React PoC uses the canonical OpenAPI (`docs/openapi.json`) so that UI requests match the API contract.
- Add a short "how to demo" checklist to README/docs for final presentation readiness.
