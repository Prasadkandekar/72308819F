const express = require("express");
const router = express.Router();
const { Log } = require("../../logging_middleware");
const notificationService = require("../service/notification.service");

router.get("/", async (req, res) => {
  await Log("backend", "info", "route", "GET /notifications called");
  const result = await notificationService.getAllNotifications();
  res.json(result);
});

// Returns top N priority notifications. Priority: Placement > Result > Event, then by recency.
router.get("/priority", async (req, res) => {
  const n = parseInt(req.query.n) || 10;
  await Log("backend", "info", "route", `GET /notifications/priority called with n=${n}`);
  const result = await notificationService.getPriorityNotifications(n);
  res.json(result);
});

module.exports = router;
