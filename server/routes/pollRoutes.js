const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    createPoll,
    votePoll,
    getChatPolls
} = require("../controllers/pollController");

router.get(
    "/poll/:chatId",
    authMiddleware,
    getChatPolls
);

router.post(
    "/poll",
    authMiddleware,
    createPoll
);

router.post(
    "/poll/:pollId/vote",
    authMiddleware,
    votePoll
);


module.exports = router;