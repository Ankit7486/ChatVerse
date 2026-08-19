const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    translateMessage
} = require("../controllers/aiController");

router.post(
    "/translate",
    authMiddleware,
    translateMessage
);

module.exports = router;