const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { searchUsers, updateProfile, uploadAvatar, removeAvatar} = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");


router.get("/users", authMiddleware, searchUsers);
router.put("/profile", authMiddleware, updateProfile);
router.post("/profile/avatar", authMiddleware, upload.single("avatar"), uploadAvatar);
router.delete("/profile/avatar", authMiddleware, removeAvatar);

module.exports = router;