const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        question: {
            type: String,
            required: true,
            trim: true
        },

        options: [
            {
                text: {
                    type: String,
                    required: true,
                    trim: true
                },

                votes: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User"
                    }
                ]
            }
        ],

        multipleAnswers: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Poll",
    pollSchema
);