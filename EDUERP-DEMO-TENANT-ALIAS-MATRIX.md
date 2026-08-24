# EDUERP DEMO TENANT ALIAS & CANONICAL ROUTING MATRIX

This matrix defines the authoritative mapping between friendly/legacy URL aliases and canonical multi-tenant slugs across all 8 educational verticals supported by EduERP.

---

## 1. Authoritative Tenant Alias Resolution Table

| # | Friendly / Legacy Alias | Canonical Tenant Slug | Vertical Type | Institutional Name | Allowed / Active |
|---|-------------------------|-----------------------|---------------|-------------------|------------------|
| 1 | `dims` | `demo-school` | `SCHOOL` | Dhaka Ideal Model High School | ✅ ALLOWED |
| 2 | `dhaka-ideal-school` | `demo-school` | `SCHOOL` | Dhaka Ideal Model High School | ✅ ALLOWED |
| 3 | `dhaka-ideal-model-school` | `demo-school` | `SCHOOL` | Dhaka Ideal Model High School | ✅ ALLOWED |
| 4 | `dhaka-ideal-model-high-school` | `demo-school` | `SCHOOL` | Dhaka Ideal Model High School | ✅ ALLOWED |
| 5 | `cmc` | `demo-college` | `COLLEGE` | Chittagong Model College | ✅ ALLOWED |
| 6 | `dhaka-imperial-college` | `demo-college` | `COLLEGE` | Chittagong Model College | ✅ ALLOWED |
| 7 | `chittagong-model-college` | `demo-college` | `COLLEGE` | Chittagong Model College | ✅ ALLOWED |
| 8 | `rmsc` | `demo-school-college` | `SCHOOL_AND_COLLEGE` | Rajshahi Model School & College | ✅ ALLOWED |
| 9 | `rajshahi-model-school-college` | `demo-school-college` | `SCHOOL_AND_COLLEGE` | Rajshahi Model School & College | ✅ ALLOWED |
| 10 | `rajshahi-model-school-and-college` | `demo-school-college` | `SCHOOL_AND_COLLEGE` | Rajshahi Model School & College | ✅ ALLOWED |
| 11 | `duim` | `demo-madrasha` | `MADRASHA` | Darul Uloom Islamia Madrasha & Hifz | ✅ ALLOWED |
| 12 | `al-jamiatul-islamia-madrasha` | `demo-madrasha` | `MADRASHA` | Darul Uloom Islamia Madrasha & Hifz | ✅ ALLOWED |
| 13 | `sylhet-madrasha` | `demo-madrasha` | `MADRASHA` | Darul Uloom Islamia Madrasha & Hifz | ✅ ALLOWED |
| 14 | `darul-uloom-islamia-madrasha` | `demo-madrasha` | `MADRASHA` | Darul Uloom Islamia Madrasha & Hifz | ✅ ALLOWED |
| 15 | `mub` | `demo-university` | `UNIVERSITY` | Metropolitan University Bangladesh | ✅ ALLOWED |
| 16 | `metropolitan-university` | `demo-university` | `UNIVERSITY` | Metropolitan University Bangladesh | ✅ ALLOWED |
| 17 | `metropolitan-university-bangladesh` | `demo-university` | `UNIVERSITY` | Metropolitan University Bangladesh | ✅ ALLOWED |
| 18 | `dpi` | `demo-polytechnic` | `POLYTECHNIC` | Dhaka Polytechnic Institute | ✅ ALLOWED |
| 19 | `dhaka-polytechnic-institute` | `demo-polytechnic` | `POLYTECHNIC` | Dhaka Polytechnic Institute | ✅ ALLOWED |
| 20 | `btva` | `demo-vocational` | `TECHNICAL_INSTITUTE` | Bangladesh Technical Vocational Academy | ✅ ALLOWED |
| 21 | `bangladesh-technical-vocational-academy` | `demo-vocational` | `TECHNICAL_INSTITUTE` | Bangladesh Technical Vocational Academy | ✅ ALLOWED |
| 22 | `nipt` | `demo-training` | `TRAINING_INSTITUTE` | National Institute of Professional Training | ✅ ALLOWED |
| 23 | `national-institute-of-professional-training` | `demo-training` | `TRAINING_INSTITUTE` | National Institute of Professional Training | ✅ ALLOWED |

---

## 2. Multi-Tenant Session & Security Rules

1. **Canonicalization Before Evaluation**:
   When an incoming request is received for route `/:tenant/*`, `resolveCanonicalTenantSlug(params.tenant)` resolves the identifier to its canonical slug before validating against the user's `session.tenantSlug`.
   
   - Authenticated User: `principal.demo-school@eduerp.us` (`tenantSlug: demo-school`)
   - Requested URL: `/dims/hr`
   - Canonical Requested: `demo-school`
   - Evaluation: `isSameTenant('demo-school', 'dims') === true`
   - Result: **HTTP 200 ALLOWED**.

2. **Cross-Tenant Strict Denial**:
   If an authenticated user from Institution A attempts to navigate to a route belonging to Institution B (either canonical slug or alias), the route guard displays a controlled security warning and halts further component loading and API calls:
   
   - Authenticated User: `principal.demo-madrasha@eduerp.us` (`tenantSlug: demo-madrasha`)
   - Requested URL: `/dims/hr` (resolves to `demo-school`)
   - Evaluation: `isSameTenant('demo-madrasha', 'dims') === false`
   - Result: **CONTROLLED CROSS-TENANT DENIAL (Security Card with Return Action)**.

3. **No Duplicate Datasets**:
   Aliases do NOT have separate database records or duplicate tables. All tenant queries use the canonical tenant UUID in `Tenant` and `Institution` tables.
