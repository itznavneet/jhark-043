# Synthetic Demo Accounts

These credentials are only for local development and SIH demonstration. They are not production credentials and must never be reused outside the local demo database.

| Role       | Email                              | Password              | Organization / identity                              | Purpose                                              | Login selector      |
| ---------- | ---------------------------------- | --------------------- | ---------------------------------------------------- | ---------------------------------------------------- | ------------------- |
| Submitter  | `citizen.rahul@example.test`       | `DevOnly-Portal-123!` | Rahul Kumar                                          | Individual citizen problem submission                | Citizen / Submitter |
| Submitter  | `panchayat.barkagaon@example.test` | `DevOnly-Portal-123!` | Barkagaon Gram Panchayat                             | Panchayati Raj problem submission                    | Citizen / Submitter |
| Submitter  | `org.jrdf@example.test`            | `DevOnly-Portal-123!` | Jharkhand Rural Development Foundation               | Organization / NGO problem submission                | Citizen / Submitter |
| Ministry   | `ministry.admin@example.test`      | `DevOnly-Portal-123!` | Ministry Innovation Administrator                    | Review, approvals, matching, applications, analytics | Ministry            |
| University | `university.water@example.test`    | `DevOnly-Portal-123!` | Jharkhand Institute of Water Technology              | Water research and collaboration demo                | University          |
| University | `university.agri@example.test`     | `DevOnly-Portal-123!` | Jharkhand Centre for Agricultural Innovation         | Agriculture matching demo                            | University          |
| University | `university.embedded@example.test` | `DevOnly-Portal-123!` | Jharkhand Embedded and Intelligent Systems Institute | Embedded/IoT matching demo                           | University          |
| Industry   | `industry.aqua@example.test`       | `DevOnly-Portal-123!` | AquaTech Solutions Pvt. Ltd.                         | Water technology support demo                        | Industry / Startup  |
| Industry   | `industry.green@example.test`      | `DevOnly-Portal-123!` | Green Rural Technologies                             | Rural sustainability support demo                    | Industry / Startup  |
| Industry   | `industry.digital@example.test`    | `DevOnly-Portal-123!` | Digital Systems India Pvt. Ltd.                      | AI and digital support demo                          | Industry / Startup  |

The seed intentionally uses the existing persisted application roles: `SUBMITTER`, `MINISTRY_ADMIN`, `UNIVERSITY`, and `INDUSTRY`. The UI selector labels are human-friendly account types and do not determine authorization.
