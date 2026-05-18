# AffordMed Backend - Implementation Overview

This project contains two backend services built with Node.js and Express,
both connected to an external evaluation API for data and logging.

---

## Problem 1: Vehicle Maintenance Scheduler

### Overview
The vehicle maintenance scheduler helps depot managers decide which vehicle
maintenance tasks to prioritize given a limited number of mechanic hours.

### How It Works

The service exposes a single REST endpoint:

```
GET /depots/:id/schedule
```

When called, it fetches two datasets in parallel from the external evaluation API:
- A list of depots, each with an available `MechanicHours` budget
- A list of vehicles, each with a `Duration` (hours needed) and `Impact` (priority score)

It then finds the depot matching the given ID and runs a scheduling algorithm
to select the best set of tasks within the available hours.

### Algorithm: Greedy Knapsack

The core logic uses a greedy knapsack approach:

1. Each vehicle task is ranked by its impact-per-hour ratio (`Impact / Duration`)
2. Tasks are sorted in descending order of this ratio
3. Tasks are picked one by one as long as they fit within the remaining mechanic hours
4. The loop stops when no more tasks can fit

This runs in O(n log n) time due to the sort step, making it efficient even
for large task lists. The response includes the selected tasks, total impact
achieved, and total hours used.

### API Response Shape

```json
{
  "depot": { "ID": 1, "MechanicHours": 20 },
  "selected": [{ "Duration": 3, "Impact": 15 }],
  "totalImpact": 15,
  "totalDuration": 3
}
```

---

## Problem 2: Notification Priority Inbox

### Overview
The notification app fetches notifications from an external API and serves
them either as a full list or filtered down to the top N by priority.

### How It Works

Two endpoints are available:

```
GET /notifications
GET /notifications/priority?n=10
```

The first returns all notifications as-is from the external API.
The second applies a priority sorting algorithm before returning results.

### Algorithm: Weighted Type Sort

Notifications are categorized by type, and each type is assigned a weight:

- `Placement` → weight 3 (highest priority)
- `Result`    → weight 2
- `Event`     → weight 1 (lowest priority)

Sorting logic:
1. Compare notifications by type weight (descending)
2. If two notifications share the same type, sort by `Timestamp` (most recent first)
3. Return the top N from the sorted list

This ensures the most important and most recent notifications always surface first.

### Authentication

The notifications API requires a Bearer token. The token is attached to every
outbound request via an `Authorization` header. All logs sent to the logging
API are also authenticated with the same token.

### Log Message Truncation

The external logging API enforces a 48-character limit on log messages.
A `truncate()` helper is used on all error messages before they are sent,
preventing 400 Bad Request errors from the logging endpoint.

---

## Shared Infrastructure

Both services use a shared `logging_middleware` module that wraps all log
calls with validation (stack, level, package) and sends them to the central
evaluation logging API using an authenticated POST request.

Both servers run independently:
- Vehicle Maintenance Scheduler: `http://localhost:3000`
- Notification App: `http://localhost:3000`
