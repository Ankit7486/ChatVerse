const multer = require("multer");

const storage = multer.memoryStorage();

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",

    "video/mp4",
    "video/webm",

    "audio/webm",
    "audio/ogg",
    "audio/mpeg",
    "audio/wav",
    "audio/mp4",

    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const upload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Unsupported file type"
                ),
                false
            );
        }

        cb(null, true);
    }
});

module.exports = upload;