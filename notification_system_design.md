# Notification System Design

## Stage 1

Students get real-time notifications for Placements, Events, and Results after login.

### API Endpoints

| Method | Endpoint | What it does |
|---|---|---|
| GET | /notifications | Get all notifications |
| GET | /notifications?isRead=false | Get unread only |
| GET | /notifications/:id | Get one notification |
| PATCH | /notifications/:id/read | Mark one as read |
| PATCH | /notifications/read-all | Mark all as read |

Headers on every request:
```
Authorization: Bearer <token>
Content-Type: application/json
```

Sample response:
```json
{
  "notifications": [
    { "id": "uuid", "type": "Placement", "message": "Google is hiring", "isRead": false, "createdAt": "2026-04-22T17:51:30Z" }
  ]
}
```

### Real-Time: WebSockets
When a student logs in, the browser opens a WebSocket connection. The server pushes new notifications instantly over that connection — no need for the browser to keep asking.

---

## Stage 2

### Database: PostgreSQL
Notifications have a fixed structure and need filtering/sorting — relational DB fits well.

```sql
CREATE TYPE notification_type AS ENUM ('Placement', 'Result', 'Event');

CREATE TABLE students (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  studentId UUID REFERENCES students(id),
  type notification_type,
  message TEXT,
  isRead BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

Key queries:
```sql
-- Get all notifications for a student
SELECT * FROM notifications WHERE studentId = $1 ORDER BY createdAt DESC;

-- Get unread
SELECT * FROM notifications WHERE studentId = $1 AND isRead = false ORDER BY createdAt DESC;

-- Mark all read
UPDATE notifications SET isRead = true WHERE studentId = $1 AND isRead = false;
```

As data grows: queries slow down, DB gets overloaded, storage bloats. Fix with indexes (Stage 3) and caching (Stage 4).

---

## Stage 3

Original slow query:
```sql
SELECT * FROM notifications WHERE studentId = 1042 AND isRead = false ORDER BY createdAt DESC;
```

It's logically correct but slow — with 5M rows and no indexes, PostgreSQL scans every row.

Fix — add a composite index:
```sql
CREATE INDEX idx_notifications_student_unread ON notifications (studentId, isRead, createdAt DESC);
```
Cost goes from O(n) full scan to O(log n) index lookup.

**Should we index every column?** No. Each index slows down INSERT/UPDATE and wastes disk space. Only index what you filter or sort by.

Find students with a Placement notification in the last 7 days:
```sql
SELECT DISTINCT studentId FROM notifications
WHERE type = 'Placement' AND createdAt >= NOW() - INTERVAL '7 days';
```

---

## Stage 4

Every page load hits the DB — with thousands of students this overwhelms it.

**Fix: Cache with Redis**
- First request → fetch from DB → store in Redis with 60s TTL
- Next requests → serve from Redis (fast, no DB hit)
- When a new notification is created → delete that student's cache so next request is fresh

| Strategy | Benefit | Tradeoff |
|---|---|---|
| Short TTL | Fresher data | More DB hits |
| Long TTL | Fewer DB hits | Stale data longer |
| Invalidate on write | Always fresh | Adds write complexity |

---

## Stage 5

Original approach processes 50,000 students one by one — if `send_email` fails at student 200, everyone else gets nothing. DB save and email are coupled, so one failure breaks both.

**Fix: Message Queue (RabbitMQ / SQS)**

```
1. bulk_save_to_db(all students)   ← always runs first, independent
2. enqueue email job per student   ← workers pick these up in parallel
3. enqueue push job per student

email_worker: dequeue → send_email → if fails, retry up to 3x → else dead-letter queue
push_worker:  dequeue → push_to_app
```

DB save and email sending are now independent. Failures are retried. Workers run in parallel so 50,000 notifications go out fast.

---

## Stage 6

Priority Inbox shows top N notifications ranked by: **type weight first** (Placement=3, Result=2, Event=1), then **recency** as tiebreaker.

Implementation in `notification_app_be/service/notification.service.js` — fetches from the external API, sorts in memory, returns top N.

Endpoint: `GET /notifications/priority?n=10`

**Keeping top N efficient as new notifications arrive:** Use a min-heap of size N. When a new notification comes in, compare it with the smallest in the heap — if it ranks higher, swap it in. This is O(log N) per update instead of re-sorting everything.
