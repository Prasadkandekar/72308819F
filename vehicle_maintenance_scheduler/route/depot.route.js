const express = require("express");
const router = express.Router();
const { Log } = require("../../logging_middleware");
const { getScheduleForDepot } = require("../service/scheduler");

router.get("/:id/schedule", async (req, res) => {
  try {
    console.log(`[route] GET /depots/${req.params.id}/schedule`);
    await Log("backend", "info", "route", `GET /depots/${req.params.id}/schedule`);
    const result = await getScheduleForDepot(req.params.id);

    if (!result) {
      console.log(`[route] Depot ${req.params.id} not found`);
      return res.status(404).json({ error: "Depot not found" });
    }

    console.log(`[route] Responding with schedule for depot ${req.params.id}`);
    res.json(result);
  } catch (err) {
    console.error(`[route] Error:`, err);
    await Log("backend", "error", "route", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
