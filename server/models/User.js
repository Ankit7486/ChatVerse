const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name : {
    type : String,
    required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    lastSeen: {
        type: Date,
        default: null
    },
    about: {
    type: String,
    default: ""
   },

    avatar: {
    type: String,
    default: ""
   },

   avatarPublicId: {
    type: String,
    default: ""
},
});

const User = mongoose.model("User", userSchema);
module.exports = User;