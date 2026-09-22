# Security Specification - Massas da Vovó

This document defines the security parameters, data invariants, and strict access controls implemented for the persistent customer profile and saved address database.

## 1. Data Invariants

- **User Profile Integrity**: A user can only read, create, or update their own profile matching their authenticated `request.auth.uid`. No user can read other users' accounts.
- **Address Privacy**: Subcollections under `/users/{userId}/addresses/` are private to `{userId}`. Only the authenticated owner can access, add, modify, or delete their saved addresses.
- **Role Lock**: There are no default roles. Users are locked to their own document IDs.
- **Data Constraints**:
  - `name` must be between 2 and 100 characters.
  - `whatsapp` must be between 8 and 20 characters.
  - Saved address `label` must be one of: `casa`, `trabalho`, or `outro`.
  - All timestamps (`createdAt`, `updatedAt`) must strictly match `request.time`.

---

## 2. The "Dirty Dozen" Threat Payloads

Here are twelve threat payloads modeled to break the system's security, all of which are rejected:

1. **Anonymous Spoofing**: Attempting to read a user profile without an authentication token.
2. **Profile Hijacking**: User `alice` attempts to read `/users/bob`.
3. **Cross-User Injection**: User `alice` attempts to write to `/users/bob`.
4. **Malicious Address Hijack**: User `alice` attempts to read `/users/bob/addresses/home-addr`.
5. **Rogue Address Insertion**: User `alice` attempts to add a delivery address to `/users/bob/addresses/home-addr`.
6. **Malicious Address Label**: Creating an address with an invalid label (e.g., `label: "invalid-label"`).
7. **Address Poisoning Attack**: Attempting to set an extremely large street name (exceeding 150 characters) to cause memory or billing exhaustion.
8. **Malicious Name Injection**: Attempting to set an extremely large name (exceeding 100 characters) in the profile.
9. **Fake Timestamp (Historic Creation)**: Attempting to create a profile with a manual static `createdAt` timestamp from the past instead of `request.time`.
10. **Shadow Field Injection**: Attempting to write unexpected fields (`isAdmin: true`) on a user profile.
11. **Impersonating Owner UID**: Attempting to write an address where `userId` does not match the parent `userId` or the authenticated user's `uid`.
12. **Tampering with ID Formats**: Injecting malicious query strings as a document ID (e.g., path traversal or injection).

---

## 3. Security Rules Validation Patterns

The following `firestore.rules` file enforces these assertions.
