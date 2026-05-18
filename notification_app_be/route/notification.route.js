const express = require("express");
const router = express.Router();
const { Log } = require("../../logging_middleware");
const notificationService = require("../service/notification.service");

router.get("/", async (req, res) => {
  console.log("[route] GET /notifications called");
  await Log("backend", "info", "route", "GET /notifications called");
  const result = await notificationService.getAllNotifications();
  console.log(`[route] Returning ${result.notifications?.length} notifications`);
  res.json(result);
});

// Returns top N priority notifications. Priority: Placement > Result > Event, then by recency.
router.get("/priority", async (req, res) => {
  const n = parseInt(req.query.n) || 10;
  console.log(`[route] GET /notifications/priority called with n=${n}`);
  await Log("backend", "info", "route", `GET /notifications/priority called with n=${n}`);
  const result = await notificationService.getPriorityNotifications(n);
  console.log(`[route] Returning ${result.notifications?.length} priority notifications`);
  res.json(result);
});

module.exports = router;
