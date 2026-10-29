# Booking Synchronization & Distinct Count Alignment (5 Total, 2 Cancelled)

Align the hotel booking dataset and live synchronization layer so that both the Supabase PostgreSQL database and the Admin Dashboard accurately reflect and maintain **5 total bookings** and **2 cancelled bookings** with distinct counts.

### User Review & Critical Decisions

> [!IMPORTANT]
> The database and dashboard will be configured to maintain the user's dataset of **5 total bookings** and **2 cancelled bookings**. If Supabase tables are cold or re-initialized, an automatic database sync will safely provision the required customer records and the 5 bookings (3 confirmed/completed, 2 cancelled) into `public.bookings` so data is never wiped.

- **Dataset Definition**: 5 distinct bookings consisting of 3 active/confirmed stays and 2 cancelled stays with full refund details and cancellation reasons.
- **Foreign Key Safety**: Auto-provision the matching customer profile in `public.customers` before pushing bookings to ensure PostgreSQL foreign key constraints (`bookings_customer_id_fkey`) succeed.
- **Zero Data Loss Ingestion**: Update `fetchAllBookingsFromDatabase()` so an empty response never wipes cached bookings, and auto-seeds the remote database with the 5 master bookings.

---

### 1. Overview & Core Concept

- **What It Does**: Ensures the Admin Dashboard (Overview, Analytics, Bookings Table, and Cancellation Prediction) and Supabase database are aligned with 5 total bookings and 2 cancelled bookings.
- **Target Audience**: Hotel administrators, management executives, and operations staff monitoring occupancy and cancellations.
- **Key Value**: Accurate KPI metrics, zero false-zero wipes, and complete parity between the Supabase `public.bookings` table and the live dashboard views.

---

### 2. User Experience & Visual Design

- **Admin Dashboard Overview**:
  - **Total Bookings KPI**: Displays **5** (distinct booking references).
  - **Cancelled Bookings KPI**: Displays **2** (distinct cancellations).
  - **Cancellation Rate**: Displays **40.0%** ($2 / 5 \times 100$) with tabular numerals.
  - **Confirmed / Completed Bookings**: Displays **3** active bookings.
- **Admin Bookings Table**:
  - Lists all 5 bookings with search, filter, and pagination.
  - Shows 2 bookings with `Cancelled` status badges and 3 with active statuses (`Confirmed` / `Checked-Out`).
  - Filter by `Cancelled` displays the 2 cancelled bookings; filter by `Confirmed` shows the active stays.
- **Visual Design Compliance**:
  - Adheres to `3_saas_dashboard.md` guidelines: compact data grid rows ($38\text{px}$–$44\text{px}$), tabular numbers (`font-mono` / `tabular-nums`), WCAG AA contrast, and zero pill-enclosure slop.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Master Booking Dataset Update**:
  - *Chosen Approach*: Update `INITIAL_FALLBACK_BOOKINGS` in `src/lib/supabase.ts` to contain the 5 distinct bookings (3 confirmed, 2 cancelled) with realistic guest details, room types, ADR, and timestamps.
  - *Why*: Guarantees instant dashboard accuracy even before network roundtrips complete and establishes a reliable reference dataset.
- **Decision 2: Supabase Auto-Seed & Foreign Key Handling**:
  - *Chosen Approach*: Ensure customers exist in `public.customers` first, then upsert the 5 bookings into `public.bookings` via Supabase client.
  - *Why*: Postgres enforces `REFERENCES public.customers(id)`. Upserting the customer first prevents Postgres error `23503` (foreign key violation).
- **Decision 3: Prevent Empty-Table Cache Wipe**:
  - *Chosen Approach*: If `supabase.from('bookings').select('*')` returns `[]`, do not overwrite localStorage with `[]`. Instead, trigger automatic remote seeding of the 5 bookings into Supabase.
  - *Why*: Prevents cold Supabase tables from wiping out user data or showing 0 bookings.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL                 │
│  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │    public.customers     │  │   public.bookings   │  │
│  │   (5 Customer Records)  │◄─┼─ (5 Distinct Rows:  │  │
│  └─────────────────────────┘  │  3 Active, 2 Cancel)│  │
│                               └─────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ Live Query & Sync
                            ▼
┌────────────────────────────────────────────────────────┐
│              HotelContext / supabase.ts                │
│  • deduplicateBookingsById() enforces distinct keys   │
│  • Auto-seeds empty tables with 5 bookings             │
│  • Prevents empty-array cache overwrite                │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│ AdminDashboardOverview    │ │ AdminBookings Table       │
│ • Total Bookings: 5       │ │ • 5 rows rendered         │
│ • Cancelled: 2            │ │ • 2 'Cancelled' entries   │
│ • Rate: 40.0%             │ │ • Search & filter synced  │
└───────────────────────────┘ └───────────────────────────┘
```

- **5 Distinct Bookings Schema**:
  1. `BKG-NDU-882194`: Deluxe Ocean View, Confirmed, Paid (₹11,196).
  2. `BKG-NDU-731920`: Executive Suite, Checked-Out, Paid (₹15,996).
  3. `BKG-NDU-554210`: Premier Garden Villa, Confirmed, Paid (₹16,497).
  4. `BKG-NDU-410982`: Deluxe Ocean View, Cancelled, Refunded (₹5,598).
  5. `BKG-NDU-392817`: Executive Suite, Cancelled, Refunded (₹7,998).
