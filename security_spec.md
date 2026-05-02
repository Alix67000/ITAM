# Firestore Security Specification

## Data Invariants
1. An asset must have a label and type.
2. Relationships (e.g., asset_contracts) must have valid asset_id and contract_id.
3. Inventory numbers follow a specific format (e.g., PC-24-001).
4. Timestamps (created_at, updated_at) must be managed by the server where possible (or validated against request.time).

## The Dirty Dozen Payloads (Red Team Test Cases)

1. **Identity Theft**: Attempt to create an asset with an arbitrary `id` (manually specified) that bypasses system logic.
2. **Shadow Field Injection**: Adding `isAdmin: true` to a user profile via client SDK.
3. **Relation Poisoning**: Creating an `asset_contracts` entry for a non-existent asset.
4. **Denial of Wallet**: Sending a 1MB string to the `specs` field.
5. **ID Poisoning**: Using `/assets/..%2F..%2Fsys_config` as a document ID.
6. **State Jumping**: Directly setting an asset status to 'Réformé' without following lifecycle (if applicable).
7. **Orphaned Write**: Creating a license without a required label.
8. **Unauthorized List**: Querying all users without being authenticated.
9. **Timestamp Spoofing**: Setting `created_at` to a date in 1970.
10. **Data Scraping**: Performing a collection group query on `events` without index or permission.
11. **PII Leak**: Reading another user's email if not an admin.
12. **Type Confusion**: Sending a boolean to a field expected to be a string (e.g., `label: true`).

## Security Rules Implementation Strategy
- Use `rules_version = '2'`.
- Default deny all.
- Helper functions for validation: `isValidAsset`, `isValidUser`, etc.
- `isSignedIn()` check for all writes.
- `isValidId()` for all document IDs.
- `affectedKeys().hasOnly()` for updates.
