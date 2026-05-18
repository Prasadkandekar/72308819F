const axios = require("axios");
const { Log } = require("../../logging_middleware");

const NOTIFICATION_API = "http://4.224.186.213/evaluation-service/notifications";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFzYWRrYW5kZWthcjJAZ21haWwuY29tIiwiZXhwIjoxNzc5MTAxNDM2LCJpYXQiOjE3NzkxMDA1MzYsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI1MTRlYWZkYS01OTY5LTQ4MjktYjZmZC0xZGE5ODdiMmM2MTgiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJwcmFzYWQga2FuZGVrYXIiLCJzdWIiOiI5OTc0NTc5Zi1kNzY3LTQ0ZmItYjM2Yy05ZTExZjY2NmQxMjYifSwiZW1haWwiOiJwcmFzYWRrYW5kZWthcjJAZ21haWwuY29tIiwibmFtZSI6InByYXNhZCBrYW5kZWthciIsInJvbGxObyI6IjcyMzA4ODE5ZiIsImFjY2Vzc0NvZGUiOiJmekVRU1EiLCJjbGllbnRJRCI6Ijk5NzQ1NzlmLWQ3NjctNDRmYi1iMzZjLTllMTFmNjY2ZDEyNiIsImNsaWVudFNlY3JldCI6InlZd01IZnJZa2ptdnJhTk0ifQ.3iZa9YiacoqrnJszDATtCeMf2aQn76EJL6M7ABQ_VkI";

// Truncate log messages to 48 chars max (API limit)
const truncate = (msg) => msg.length > 48 ? msg.substring(0, 48) : msg;

// Weight map for priority inbox: higher number = higher priority
const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

async function fetchFromAPI() {
  await Log("backend", "info", "service", "Fetching notifications from external API");
  const response = await axios.get(NOTIFICATION_API, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  return response.data.notifications;
}

async function getAllNotifications() {
  try {
    const notifications = await fetchFromAPI();
    await Log("backend", "info", "service", `Fetched ${notifications.length} notifications`);
    return { notifications };
  } catch (err) {
    await Log("backend", "error", "service", truncate(`Fetch failed: ${err.message}`));
    throw err;
  }
}

async function getPriorityNotifications(n) {
  try {
    const notifications = await fetchFromAPI();

    // Sort by type weight descending, then by timestamp descending (most recent first)
    const sorted = notifications.sort((a, b) => {
      const weightDiff = (TYPE_WEIGHT[b.Type] || 0) - (TYPE_WEIGHT[a.Type] || 0);
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.Timestamp) - new Date(a.Timestamp);
    });

    const top = sorted.slice(0, n);
    await Log("backend", "info", "service", `Returning top ${n} priority notifications`);
    return { notifications: top };
  } catch (err) {
    await Log("backend", "error", "service", truncate(`Priority fetch failed: ${err.message}`));
    throw err;
  }
}

module.exports = { getAllNotifications, getPriorityNotifications };
