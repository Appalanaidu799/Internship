# Unified User Directory & Role Promotion Management

Expand the Admin panel's user management module from a management-only list into a comprehensive **User & Role Access Management Console**. This console provides complete visibility over all hotel users (Customers, Management, and Admins), alongside a secure **Action Modal Dialog** allowing Administrators to review and promote/demote user roles across Customer, Management, and Admin tiers with real-time Supabase database synchronization.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and interaction decisions have been aligned based on user preferences and existing system security rules:

- **Confirmed Decision (Phase 1)**: Role modification uses an **Action Modal Dialog** rather than instant inline switching, providing administrators with a clear audit review (showing user email, current role, destination clearance tier, and access privileges summary) before committing the change.
- **Unified Directory Scope**: The "Management Users" tab will be upgraded to **"User & Access Management"**, featuring segmented tabs to filter by `All Users`, `Customers`, `Management`, and `Administrators`, with instant search and status indicators.
- **Safety Self-Demotion Guard**: The system prevents the currently logged-in administrator from demoting or revoking their own active Admin account, preventing lockouts.
- **Database Synchronization**: Role mutations update `public.users.role` in Supabase with automatic real-time propagation across active sessions.

---

## 1. Overview & Core Concept

- **What It Does**: Enables administrators to supervise the complete hotel user roster in one place. Admins can view customer and staff accounts, inspect their registration details and activity, and change any user's role between **Customer**, **Management**, and **Admin** via a dedicated confirmation modal.
- **Target Audience / Persona**: Hotel General Managers and System Administrators managing personnel clearances, customer escalations, and front-desk operator onboarding.
- **Key Value**: Eliminates the disconnect between separate customer and management lists. Provides an intuitive, secure governance workflow to grant management privileges or revoke access without manual database queries.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Browsing & Filtering the Directory**:
   - Admin navigates to the User & Access Management console.
   - Admin views summary counts across `All Users`, `Customers`, `Management Staff`, and `Administrators`.
   - Admin can search by name, email, phone, or Customer ID, or toggle quick role filter tabs.
2. **Changing User Role (Action Modal)**:
   - Admin clicks **Change Role** (`ShieldCheck` icon) on any user row.
   - The **"Modify User Access & Role Clearance"** modal opens with:
     - User Identity card (Avatar, Full Name, Email, Registration Date).
     - Current Role badge and Target Role selection cards (Customer, Management, Admin) explaining granted permissions.
     - Confirmation note detailing the change.
   - Admin confirms the change:
     - The modal shows a loading spinner during the Supabase mutation.
     - A green success banner confirms: *"User role for [Name] successfully changed to [New Role]"*.
     - The directory table and summary badges update immediately via Supabase Realtime.

### Visual Identity & Theme
- **Role Tier Representation**:
  - `Admin`: Rose accent (`text-rose-700 bg-rose-50 border-rose-200`) denoting system authority.
  - `Management`: Blue accent (`text-blue-700 bg-blue-50 border-blue-200`) denoting hotel operations.
  - `Customer`: Emerald accent (`text-emerald-700 bg-emerald-50 border-emerald-200`) denoting verified guest status.
- **Design Restraint**: Adheres to zero-pill typography and clear structural card hierarchy. Interactive controls use clean segmented button groups.

---

## 3. Key Product Decisions & Trade-Offs

- **Modal Confirmation vs. Instant Row Select**:
  - *Chosen Approach*: An interactive Modal dialog showing clear explanations of permissions for each tier.
  - *Why*: Changing an account to Admin or Management grants access to sensitive financial, booking, and operational controls. A deliberate confirmation step prevents accidental permission escalation.
- **Single Source of Truth (`public.users`)**:
  - *Chosen Approach*: Update `role` directly on the canonical `public.users` table in Supabase.
  - *Why*: `public.users` is already checked on login and session restoration by `AuthContext`. Updating this field ensures immediate role enforcement on next refresh or live session re-verification.

---

## 4. Technical Architecture & Data Strategy

### System Component & Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Admin Web Client                                │
│                                                                        │
│  ┌────────────────────────┐         ┌───────────────────────────────┐  │
│  │ User Directory Table   │ ──────> │ Role Modification Modal       │  │
│  │ (Search, Filter Tabs,  │         │ (Preview, Permission Details, │  │
│  │  Paginated Rows)       │         │  Confirm / Cancel Handler)    │  │
│  └────────────────────────┘         └───────────────┬───────────────┘  │
│              ▲                                      │                  │
└──────────────┼──────────────────────────────────────┼──────────────────┘
               │                                      │
               │ State Invalidation & Realtime Sync   │ supabase.from('users')
               │ (postgres_changes on public.users)   │ .update({ role })
               ▼                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Supabase PostgreSQL                             │
│                                                                        │
│  ┌────────────────────────┐         ┌───────────────────────────────┐  │
│  │ public.users           │ <====== │ public.customers              │  │
│  │ (id, email, full_name, │         │ (linked customer profile,     │  │
│  │  role: admin|mgmt|cust)│         │  address, KYC details)        │  │
│  └────────────────────────┘         └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Interactive State & Component Mapping

1. **`HotelContext.tsx` Extension**:
   - Add `allUsers: UserProfile[]` state and `updateUserRole(userId: string, newRole: UserRole): Promise<void>`.
   - Update `refreshAllData` to fetch all records from `public.users` (`SELECT * FROM users ORDER BY created_at DESC`).
   - Wire `postgres_changes` on `public.users` to automatically refresh users.
2. **`AdminManagementUsers.tsx` Transformation**:
   - Rename / extend to comprehensive user management view.
   - Filter segmented buttons: `All (N)`, `Customers (N)`, `Management (N)`, `Admins (N)`.
   - Action Modal dialog state: `selectedUserForRoleChange`, `targetRole`, `isSubmitting`, `feedbackMessage`.
   - Prevent demoting current admin's own ID (`currentUserId === user.id`).
3. **Sidebar / Navigation Label**:
   - Update navigation label from *"Management Users"* to *"User Directory & Roles"*.
