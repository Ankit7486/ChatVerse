const express = require("express");
const multer = require("multer");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    createStatus,
    getMyStatuses,
    deleteStatus,
    viewStatus
} = require("../controllers/statusController");


// Image upload configuration
const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only image files are allowed"
                )
            );
        }
    }
});


// TEXT + IMAGE STATUS
router.post(
    "/status",
    authMiddleware,
    upload.single("media"),
    createStatus
);

router.get(
    "/status/my",
    authMiddleware,
    getMyStatuses
);

router.delete(
    "/status/:statusId",
    authMiddleware,
    deleteStatus
);

router.post(
    "/status/:statusId/view",
    authMiddleware,
    viewStatus
);

module.exports = router;