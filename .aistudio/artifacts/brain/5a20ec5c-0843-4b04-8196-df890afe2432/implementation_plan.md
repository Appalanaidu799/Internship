# Dynamic Cancellation Engine & Multi-Tier Refund System

A full-stack enhancement enabling customers to cancel hotel reservations with day-based automated refund calculations, removing the restrictive deadline lock, visualizing the cancellation action inside the Digital Voucher, and synchronizing the `Cancelled` state across Customer, Management, and Admin roles in Supabase.

## User Review & Critical Decisions

> [!IMPORTANT]
> The restrictive deadline notice (`Cancellation deadline elapsed (<48h)`) will be completely eliminated. Instead, customers can cancel reservations with transparent, day-based refund tier calculations credited back to their original payment instrument (Razorpay).

- **Confirmed Refund Tier Schedule**:
  - **$\ge 7$ Days Before Check-in**: 100% Full Refund (0% cancellation fee)
  - **3 to 6 Days Before Check-in**: 75% Partial Refund (25% hotel retention fee)
  - **1 to 2 Days Before Check-in**: 50% Standard Refund (50% hotel retention fee)
  - **$< 24$ Hours / Same-Day**: 25% Courtesy Refund (75% retention fee)
- **Cancellation Action Placement**:
  - Prominently visualized inside the **Digital Stay Voucher & Folio modal** via an interactive cancellation bar and button.
  - Also available on active booking cards for direct access.
- **Cross-Role Database Synchronization**:
  - Mutates `public.bookings` in Supabase with `booking_status: 'Cancelled'`, `payment_status: 'Refunded'`, and stores the computed `refund_amount`.
  - Instantly refreshes Customer, Management, and Admin dashboards without page reloads.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces static cancellation blockages with an automated, fair cancellation and refund system. Guests opening their booking voucher can review their stay details, click **"Cancel Reservation"**, inspect the dynamic refund breakdown based on arrival lead time, and confirm cancellation with live Supabase persistence.
- **Target Audience / Persona**:
  - **Customers**: Can cancel stays flexibly with clear financial expectations and instant confirmation.
  - **Management**: Immediately sees cancelled rooms returned to available inventory, preventing unnecessary check-in preparations.
  - **Admin**: Views live financial reconciliation (collected revenue vs. processed refunds) and accurate cancellation rates.
- **Key Value**: Eliminates guest frustration, adheres to modern hospitality standards, and maintains database integrity across all three user roles.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Viewing Voucher & Initiating Cancellation**:
   - Customer navigates to **My Bookings**.
   - Clicks **"View Voucher"** on any confirmed reservation.
   - The Digital Voucher displays a prominent **"Cancellation & Refund Option"** action strip in the footer alongside a quick summary of the applicable refund percentage.
   - Clicking **"Cancel Reservation"** opens the **Cancellation & Refund Settlement Modal**.

2. **Refund Calculation & Confirmation Modal**:
   - Computes days remaining until check-in:
     $$\text{Days Remaining} = \left\lceil \frac{T_{\text{check-in}} - T_{\text{today}}}{86,400,000} \right\rceil$$
   - Displays a structured financial folio breakdown:
     - Original Amount Paid (e.g. ₹12,540)
     - Days to Check-in & Applied Tier (e.g. 5 days remaining $\rightarrow$ 75% Refund Tier)
     - Hotel Service Retention Fee (25% = ₹3,135)
     - **Net Refund Amount to Customer (75% = ₹9,405)**
     - Payment Refund Destination: *"Credited back to originating Razorpay payment instrument"*
   - Reason for cancellation dropdown (e.g., *Change of Travel Dates*, *Personal Emergency*, *Flight Rescheduled*, *Other*).
   - Customer clicks **"Confirm & Process Refund"**.

3. **Multi-Role Live Reaction**:
   - **Customer**: Booking immediately shifts from "Upcoming/All" to the "Cancelled" tab with a `Cancelled` status badge and refund receipt details.
   - **Management**: The reservation reflects as `Cancelled` in Operations Bookings, room keycard unassigns, and occupancy metric recalculates.
   - **Admin**: Master Bookings Ledger updates to `Cancelled`, refund amounts log into the financial analytics, and cancellation risk tracking recalculates.

### Visual Styling & Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  Cancel Reservation & Refund Breakdown                                │
├────────────────────────────────────────────────────────────────────────┤
│  Booking Reference: BKG-NDU-778901 · Executive Business Suite          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Check-In: 2026-11-04  ·  Days Remaining: 7 Days (100% Tier)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Financial Settlement:                                                 │
│    Total Paid (Razorpay):                          ₹12,540             │
│    Cancellation Retention Fee (0%):                     ₹0             │
│    ───────────────────────────────────────────────────────             │
│    Net Refund Payable:                             ₹12,540             │
│                                                                        │
│  Reason for Cancellation:                                              │
│  [ Change of travel plans / scheduling conflict                 ▼ ]   │
│                                                                        │
│  [ Keep Reservation ]                   [ Confirm Cancellation & Refund ]
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Continuous Day-Based Tiered Refund vs. Strict 48-Hour Hard Cutoff**:
  - *Chosen Approach*: Replace the `<48h` lockout with progressive tiers (100% $\ge 7$ days, 75% 3–6 days, 50% 1–2 days, 25% $< 24$ hours).
  - *Why*: Provides guests with partial recourse even close to check-in while protecting hotel revenue with reasonable retention fees.
- **Decision 2: Dual Entry Points (Voucher Modal + Booking Card)**:
  - *Chosen Approach*: Place the primary cancellation trigger inside the **View Voucher** modal (as explicitly requested) while also providing a secondary direct button on the card.
  - *Why*: Guests examining the voucher have full context of room details, policy, and payment method before proceeding.
- **Decision 3: Atomic Multi-Role State Invalidation**:
  - *Chosen Approach*: Mutate both remote Supabase `public.bookings` and local state caches, followed by an immediate multi-entity context refresh (`refreshAllData()`).
  - *Why*: Ensures that if an Admin or Manager is logged in on another screen, their queries reflect the cancellation and updated room occupancy instantly.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACES                              │
│                                                                        │
│  [ Customer: My Bookings ]   [ Management: Bookings ]   [ Admin: Ledger ]
│         │                               │                      │       │
│   (View Voucher)                        │                      │       │
│         ▼                               │                      │       │
│  [ Voucher Modal ]                      │                      │       │
│         │                               │                      │       │
│   (Cancel Click)                        │                      │       │
│         ▼                               │                      │       │
│  [ Refund Breakdown Modal ]             │                      │       │
│         │                               │                      │       │
│   (Confirm Action)                      │                      │       │
└─────────┼───────────────────────────────┴──────────────────────┴───────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        HOTEL CONTEXT ENGINE                            │
│  • calculateRefund(booking, checkInDate): { refund, fee, tier, days }  │
│  • cancelBookingWithRefund(bookingId, refundDetails)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE POSTGRESQL LAYER                         │
│  UPDATE public.bookings                                                │
│  SET booking_status = 'Cancelled',                                     │
│      payment_status = 'Refunded',                                      │
│      refund_amount = $refund,                                          │
│      cancellation_reason = $reason,                                    │
│      updated_at = NOW()                                                │
│  WHERE booking_reference = $ref OR id = $id                            │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & State Changes

1. **`src/types/hotel.ts`**:
   - Add `refundAmount?: number`, `cancellationFee?: number`, `cancellationReason?: string`, `cancelledAt?: string` to the `Booking` interface.
2. **`src/lib/supabase.ts` & `src/context/HotelContext.tsx`**:
   - Expand `cancelBookingInDatabase` and `cancelBooking` to accept structured refund details and persist them into Supabase.
   - Implement `calculateRefundTier(checkInDate: string, totalAmount: number)` utility.
3. **`src/components/customer/CustomerMyBookings.tsx`**:
   - Remove `<span className="... text-slate-400">Cancellation deadline elapsed (<48h)</span>`.
   - Add the cancellation action inside the **Digital Stay Voucher & Folio modal**.
   - Build the **Cancellation & Refund Confirmation Modal** with interactive reason selector and detailed rupee breakdown.
4. **`src/components/admin/AdminBookings.tsx` & `src/components/management/ManagementBookings.tsx`**:
   - Verify that cancelled bookings show the `Cancelled` badge and display refund details where applicable.
