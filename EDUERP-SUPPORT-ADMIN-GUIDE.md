# EDUERP SUPPORT ADMIN & OPERATIONS GUIDE
## Super Admin & Support Agent Operating Manual for Client Success & Ticketing

This guide outlines the daily operating workflows, triage procedures, SLA standards, and CMS management tools for EduERP Platform Support Admins and Customer Success Specialists.

---

## 1. Super Admin Navigation & Control Plane

Support Admins access the central control plane via `/super-admin`:

- **/super-admin/support**: Real-time Support Ops Dashboard with open queue metrics, SLA breach alerts, and team workloads.
- **/super-admin/support/tickets**: Master ticket queue with multi-filter search (by status, priority, vertical, assigned agent).
- **/super-admin/support/tickets/[ticketNumber]**: Individual Ticket Resolution Console.
- **/super-admin/inquiries**: Prospective institutional sales and demo inquiry queue with lead status qualification.
- **/super-admin/knowledge**: Knowledge Base CMS for managing categories, articles, and SEO tags.
- **/super-admin/faqs**: Frequently Asked Questions management grouped by operational domain.
- **/super-admin/releases**: Changelog and release notes publisher.
- **/super-admin/sla**: Service Level Agreement policy configurations.
- **/super-admin/contact-settings**: Company contact details, phone, email, and WhatsApp settings.

---

## 2. Support Ticket Triage & SLA Matrix

### Priority Levels & Target Turnarounds:
| Priority | First Response SLA | Resolution SLA | Typical Scenario |
|---|---|---|---|
| **CRITICAL** | **60 mins** | **4 hours** | Complete portal outage, admission portal downtime on exam deadline day, payment gateway failure |
| **URGENT** | **2 hours** | **12 hours** | Biometric attendance synchronization failure, gradebook batch generation blockage |
| **HIGH** | **4 hours** | **24 hours** | Teacher mark submission error, custom report formula calculation discrepancy |
| **NORMAL** | **8 hours** | **48 hours** | General configuration assistance, student profile batch import assistance |
| **LOW** | **24 hours** | **96 hours** | Feature requests, cosmetic suggestions, minor documentation feedback |

### Ticket Status Lifecycle:
1. **`OPEN`**: Newly created by customer. Unassigned or awaiting triage.
2. **`ASSIGNED`**: Routed to a specialized support team or dedicated agent.
3. **`IN_PROGRESS`**: Agent is actively diagnosing or resolving the inquiry.
4. **`WAITING_FOR_CUSTOMER`**: Agent sent a public reply requiring additional context or student ID details.
5. **`CUSTOMER_REPLIED`**: Customer responded to the agent's question, moving ticket back to active queue.
6. **`RESOLVED`**: Agent resolved the issue with a resolution summary. Customer receives confirmation prompt.
7. **`CLOSED`**: Customer confirmed resolution or 7-day auto-close expired with CSAT survey dispatched.
8. **`REOPENED`**: Customer flagged that the issue persists within 14 days of resolution.

---

## 3. Communication Discipline: Public Replies vs Internal Notes

- **`PUBLIC_REPLY`**: Sent directly to the institution's authenticated users and administrators. Keep tone empathetic, structured, and precise with step-by-step resolution instructions.
- **`INTERNAL_NOTE`**: Visible ONLY to Platform Administrators and Support Staff. Use internal notes to:
  - Coordinate with backend engineering.
  - Record investigation queries or server log excerpts.
  - Tag Tier-2 specialists for code patch approvals.
  - **Security Guarantee:** Internal notes are strictly excluded from tenant customer queries at the database layer.

---

## 4. Knowledge Base & CMS Publishing Best Practices

1. **Title & Summary:** Keep titles action-oriented (e.g., *How to configure HSC subject combinations*).
2. **Markdown Formatting:** Use clear headings, bulleted lists, and step numbers.
3. **Visibility & Roles:** Set `applicableRoles` and `institutionTypes` to ensure relevant discovery.
4. **Tags:** Add relevant search keywords (`fees`, `bkash`, `admission`, `gpa`, `hifz`) to empower the pre-ticket recommendation engine.

---

## 5. Contact Inquiries & Commercial Follow-up

When prospective institutions submit inquiries at `/contact`:
1. The lead receives an automated, concurrency-safe inquiry number (e.g., `INQ-2026-000042`).
2. Support Admins inspect the lead at `/super-admin/inquiries`.
3. Qualify the institution based on campus count, student enrollment, and curriculum requirements.
4. Update inquiry status: `NEW` -> `CONTACTED` -> `QUALIFIED` -> `PROPOSAL_SENT` -> `DEMO_SCHEDULED` -> `CONVERTED`.
