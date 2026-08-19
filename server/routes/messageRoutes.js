const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { sendMessage, allMessage, markChatRead, editMessage, deleteMessage, toggleReaction, uploadMessageFile, togglePinMessage} = require("../controllers/messageController");
const upload = require("../middleware/uploadMiddleware");

router.post("/message", authMiddleware, sendMessage);
router.get("/message/:chatId", authMiddleware, allMessage);
router.patch(
    "/message/read/:chatId",
    authMiddleware,
    markChatRead
);
router.patch(
    "/message/:messageId",
    authMiddleware,
    editMessage
);
router.patch(
    "/message/:messageId/pin",
    authMiddleware,
    togglePinMessage
);
router.delete(
    "/message/:messageId",
    authMiddleware,
    deleteMessage
);
router.post(
    "/message/:messageId/reaction",
    authMiddleware,
    toggleReaction
);
router.post(
    "/message/upload",
    authMiddleware,
    upload.single("file"),
    uploadMessageFile
);



module.exports = router;