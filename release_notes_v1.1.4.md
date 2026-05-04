# Morphic CMS Release Notes - v1.1.4

## Featured: API Analytics & Observability

This release introduces a robust logging and analytics system, giving you deep insights into how your API is being used by external applications.

### Key Improvements

#### 1. API Logging & Monitoring

- **Integrated Middleware**: Every external REST API request is now tracked for performance and audit purposes.
- **Performance Tracking**: We now record `responseTime` in milliseconds for every hit, helping you identify slow endpoints.
- **Metadata Capture**: Logs now include HTTP Method, Path, Status Code, IP Address, and User-Agent.

#### 2. Analytics Dashboard

- **Traffic Velocity Chart**: A new interactive line chart on the dashboard visualizing request volume over the last 7 days.
- **Latency Monitoring**: An area chart tracking average response time trends to ensure your API stays blazing fast.
- **Overview Metrics**: At-a-glance counters for "Total Hits" and "Average Latency."

#### 3. Intelligent Data Management

- **External-Only Filter**: The system now intelligently filters out internal CMS traffic (Inertia requests), ensuring your analytics reflect true external usage.
- **Auto-Cleanup**: Built-in logic to automatically delete logs older than 7 days, preventing database bloat while maintaining a rolling window of insights.
- **Indexed Performance**: Added database indexes to `createdAt` and `path` to ensure analytics queries remain sub-millisecond even as log volume grows.

#### 4. UI & UX Refinements

- **Smart Truncation**: Text-heavy table cells in the Entries list now use intelligent truncation with elipses, keeping your layout clean.
- **Native Tooltips**: Hover over any truncated cell to see the full content instantly via native browser tooltips.
- **Case-Insensitive Search**: Improved the search engine for Users and Collections to be more robust when handling nullable database columns.

---

### Technical Changes

- **Dependency Added**: `recharts` for high-performance data visualization.
- **Database Migration**: Added `api_logs` table and optimized indexes for search.
- **API Refactor**: Switched search logic to raw SQL fragments for cross-compatibility with nullable name fields.
