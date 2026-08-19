const express = require("express");
const router = express.Router();

const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    }
});

const authMiddleware = require("../middleware/authMiddleware");

const { accessChat, createGroupChat, fetchChats, togglePinChat, toggleMuteChat, toggleArchiveChat, deleteChat , addGroupMembers, removeGroupMember, updateGroupInfo,leaveGroup, uploadGroupAvatar,createAnnouncement, deleteAnnouncement, transferGroupAdmin, updateGroupPermissions } = require("../controllers/chatController");

router.post("/chat", authMiddleware, accessChat);
router.post("/chat/group",authMiddleware,createGroupChat);
router.patch("/chat/:chatId/members",authMiddleware,addGroupMembers);
router.delete("/chat/:chatId/members/:memberId",authMiddleware,removeGroupMember);
router.get("/chat", authMiddleware, fetchChats);
router.patch("/chat/:chatId/pin",authMiddleware,togglePinChat);
router.patch("/chat/:chatId/mute",authMiddleware,toggleMuteChat);
router.patch("/chat/:chatId/archive",authMiddleware,toggleArchiveChat);
router.delete("/chat/:chatId",authMiddleware,deleteChat);
router.patch("/chat/:chatId/group-info",authMiddleware,updateGroupInfo);
router.patch("/chat/:chatId/group-avatar",authMiddleware,upload.single("groupAvatar"),uploadGroupAvatar);
router.delete("/chat/:chatId/leave",authMiddleware,leaveGroup);
router.post("/chat/:chatId/announcement",authMiddleware,createAnnouncement);
router.delete("/chat/:chatId/announcement",authMiddleware,deleteAnnouncement);
router.patch("/chat/:chatId/admin/:newAdminId",authMiddleware,transferGroupAdmin);
router.patch("/chat/:chatId/permissions",authMiddleware,updateGroupPermissions);

module.exports = router;