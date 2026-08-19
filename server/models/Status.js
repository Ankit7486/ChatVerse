const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: ["text", "image", "video"],
            default: "text"
        },

        content: {
            type: String,
            default: ""
        },

        mediaUrl: {
            type: String,
            default: ""
        },

        background: {
            type: String,
            default: ""
        },

        viewers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// MongoDB automatically removes expired statuses
statusSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
    "Status",
    statusSchema
);