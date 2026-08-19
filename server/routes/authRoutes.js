const express = require("express");
const router = express.Router();
const { registerUser, loginUser, profileUser, deleteAccount } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, profileUser);
router.delete("/profile", authMiddleware, deleteAccount);

module.exports = router;