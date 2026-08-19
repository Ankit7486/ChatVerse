const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema (
    {
        sender : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
            required : true
        },

        chat : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Chat",
            required : true
        },

        content : {
            type : String,
            required : true,
            trim : true
        },

        isRead : {
            type : Boolean,
            default : false
        },

        edited: {
            type:Boolean,
            default: false
        },

        deleted: {
            type: Boolean,
            default: false
        },

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },

        readBy: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
    ],

        reactions: [
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        emoji: {
            type: String,
            required: true
        }
    }
],

      pinned: {
    type: Boolean,
    default: false
},

pinnedAt: {
    type: Date,
    default: null
},

pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
},

      messageType: {
    type: String,
    enum: [
        "text",
        "image",
        "video",
        "audio",
        "file",
        "system"
    ],
    default: "text"
},

   systemAction: {
    type: String,
    default: ""
},

systemData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
},

fileUrl: {
    type: String,
    default: ""
},

fileName: {
    type: String,
    default: ""
},

fileSize: {
    type: Number,
    default: 0
},

filePublicId: {
    type: String,
    default: ""
},

mimeType: {
    type: String,
    default: ""
},
    },
    {
        timestamps : true
    }
);

module.exports = mongoose.model("Message", messageSchema);