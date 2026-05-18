const express = require("express");
const { Log } = require("../logging_middleware");
const depotRoute = require("./route/depot.route");

const app = express();
app.use(express.json());

app.use("/depots", depotRoute);

const PORT = 3000;
app.listen(PORT, async () => {
  await Log("backend", "info", "service", `Server running on port ${PORT}`);
});
