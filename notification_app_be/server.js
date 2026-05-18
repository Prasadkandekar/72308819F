const express = require("express");
const { Log } = require("../logging_middleware");
const notificationRoute = require("./route/notification.route");

const app = express();
app.use(express.json());

app.use("/notifications", notificationRoute);

const PORT = 3000;
app.listen(PORT, async () => {
  await Log("backend", "info", "service", `Notification server running on port ${PORT}`);
});
