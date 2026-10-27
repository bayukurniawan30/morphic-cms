# Morphic CMS Release Notes - v1.5.0

**Morphic CMS v1.5.0** adds text, date, and relation filters, sorting by schema fields, and interactive filter controls in API Preview. REST and GraphQL share the same validation and query behavior.

---

## Key Features

### Expanded Entry Filters

- **Text and Textarea**: Use `filter[title]=Hello` or `filter[title][eq]=Hello` for case-sensitive equality, and `filter[title][icontains]=hello` for case-insensitive contains. Contains treats `%`, `_`, and backslashes literally.
- **Single dates and ranges**: Filter Date fields with `filter[publish_date]=2026-10-25`, or combine `filter[publish_date][gte]=2026-10-01` and `filter[publish_date][lte]=2026-10-31` for an inclusive range. Either boundary can be omitted. Invalid dates and reversed ranges are rejected; Time/Datetime fields are outside this feature's scope.
- **Connected collection entries**: Use `filter[category]=42` or `filter[category][eq]=42` to match a stored relation ID. The filter key is the relation field's name inside the source collection; the value is a positive integer connected entry ID. Matching still uses stored references when targets are unpublished or deleted, with existing relation-population behavior preserved.
- **Combined filters**: Top-level filters use AND logic before counting and pagination. Existing Select, Radio, and Boolean filters remain available.
- **GraphQL parity**: The `filters` JSON argument supports the same operators, including `title: { icontains: "hello" }`, `publish_date: { gte: "2026-10-01", lte: "2026-10-31" }`, and `category: { eq: 42 }`.

### Sort by Schema Fields

- **Supported types**: Sort top-level Number, Text, Email, Date, and Boolean fields with `sortBy` and `sortDir` in REST and GraphQL.
- **Typed ordering**: Numbers sort numerically; Text and Email sort alphabetically ignoring case; Dates sort chronologically; Booleans sort false before true ascending.
- **Consistent pagination**: Missing, null, empty-string, invalidly typed values, and invalid dates sort last in either direction. Equal values use entry ID ascending as a tie-breaker.
- **Existing system sorting**: `id` and `createdAt` remain available and take precedence over schema fields with the same names. The default remains creation date descending.

### API Preview Filter Controls

- **Field-aware controls**: Add filters using text inputs, date/range inputs, Boolean and configured-option pickers, and connected entry ID inputs.
- **Apply and clear**: Validate filters before applying, reset pagination to page 1, and remove individual filters or clear all filters.
- **Shared requests and examples**: Applied filters carry across REST and GraphQL previews and appear in displayed/copied URLs, cURL commands, and GraphQL queries.
- **Live GraphQL responses**: GraphQL Preview now executes its displayed query and shows the actual response and request errors.
- **Preview usability**: REST Preview scrolls to keep the JSON response reachable without expanding. Filter dropdown arrows have consistent spacing, and value inputs match dropdown backgrounds.

---

## Documentation & Developer Experience

- Updated the README, API Docs, General Documentation, and entry API help with filter/sort syntax, supported field types, examples, and limitations.
- Split API integration tests into category files under `src/api/tests/`, with dedicated relation and sorting coverage.
- Restricted Vitest discovery to application tests; the CLI package's Node tests run separately with `pnpm --dir packages/create-morphic-cms test`.
- Added preview-filter serialization and validation coverage. The latest full verification passed **157 tests**, TypeScript checks, and the production build.

---

## Upgrade Notes

- No new database migration is required for these features on an up-to-date v1.4.2 database.
- Invalid filters or unsupported sort fields/directions now return REST HTTP 400 or GraphQL `BAD_USER_INPUT`; unknown sort fields no longer silently fall back to creation-date ordering.
- Filtering remains limited to supported top-level fields. Nested relation title/slug filters, multiple relation IDs, and multi-value Select filters are unsupported.
- Schema sorting is limited to Number, Text, Email, Date, and Boolean. Other schema types, including Textarea, Slug, Select/Radio, Relation, arrays, and groups, are unsupported.
- The separately distributed `@morphic-cms/sdk` has not been updated as part of this CMS release. SDK consumers need compatible query serialization to use nested filter operators.
