const express = require("express");
const router = express.Router();
const { createActivity, getActivities } = require("../controllers/activity.controller");
const auth = require("../middleware/auth");

router.post("/", createActivity);         // agent can still post
router.get("/", auth, getActivities);      // dashboard must be logged in

module.exports = router;