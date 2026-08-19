const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema(
    {
        participants :[
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : "User",
            },
        ],

        isGroupChat : {
            type : Boolean,
            default : false,
        },

        onlyAdminsCanSend: {
    type: Boolean,
    default: false 
},

    announcement: {
    content: {
        type: String,
        default: ""
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    createdAt: {
        type: Date,
        default: null
    },

    isActive: {
        type: Boolean,
        default: false
    }
},

        chatName : {
            type : String,
            default : "",
        },

        groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
},

groupAvatar: {
    type: String,
    default: ""
},

groupDescription: {
    type: String,
    default: ""
},

        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
        },

        latestMessage : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Message",
        },

        pinnedBy: [
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
        }
       ],

        mutedBy: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
          }
      ],
       archivedBy: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
],
      
    },
    {
        timestamps : true
    }
);

module.exports = mongoose.model("Chat", chatSchema);