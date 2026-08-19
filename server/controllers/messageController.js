const Message = require("../models/Message");
const Chat = require("../models/Chat");
const cloudinary = require("../config/cloudinary");

const sendMessage = async (req, res) => {
     try {
        const { content, chatId, replyTo } = req.body;

        if(!content || !chatId) {
            return res.status(400).json({
                message : "Content and Chat ID are required"
            });
        }

        const chat = await Chat.findOne({
    _id: chatId,
    participants: req.user.id
      });

if (!chat) {

    return res.status(403).json({
        message: "You are not a participant of this chat"
    });

}

        const message = await Message.create({
            sender : req.user.id,
            content,
            chat : chatId,
            replyTo: replyTo || null
        });

        const otherParticipants = chat.participants.filter(
    (id) => id.toString() !== req.user.id.toString()
    );
        for (const participantId of otherParticipants) {

    await Chat.findByIdAndUpdate(chatId, {
        $inc: {
            [`unreadCounts.${participantId.toString()}`]: 1
        }
    });

}

       
        let fullMessage = await Message.findById(message._id)
           .populate("sender", "name email avatar")
           .populate("chat")
           .populate({
        path: "replyTo",
        populate: {
            path: "sender",
            select: "name"
        }
        })
        .populate(
    "reactions.user",
    "name"
);

        await Chat.findByIdAndUpdate(chatId, {
            latestMessage : message._id
        });

        const io = req.app.get("io");
        io.to(chatId.toString()).emit(
            "newMessage",
            fullMessage
        )

        res.status(201).json(fullMessage);
     }

     catch(error) {
        res.status(500).json({
            message : error.message
        })
     }
};

const allMessage = async (req, res) => {
    try {
        const{chatId} = req.params;
        const chat = await Chat.findOne({
           _id: chatId,
           participants: req.user.id
       });

       if (!chat) {
    return res.status(403).json({
        message: "You are not a participant of this chat"
         });
     }
        const messages = await Message.find({
            chat : chatId
        })
        .populate("sender", "name email avatar")
        .populate("chat")
        .populate({
    path: "replyTo",
    populate: {
        path: "sender",
        select: "name"
    }
})
        .populate(
    "reactions.user",
    "name"
)
        .sort({ createdAt : 1});

        res.status(200).json(messages);
    }
    catch( error ) {
        res.status(500).json ({
            message: error.message
        });
    }
};

const markChatRead = async (req, res) => {

    try {

        const { chatId } = req.params;

        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(403).json({
                message: "You are not a participant of this chat"
            });
        }

        await Chat.findByIdAndUpdate(chatId, {
            $set: {
                [`unreadCounts.${userId}`]: 0
            }
        });

         // Mark messages from OTHER users as read
        const result = await Message.updateMany(
            {
                chat: chatId,
                sender: { $ne: userId },
                readBy: { $ne: userId }
            },
            {
                $addToSet: {
                    readBy: userId
                }
            }
        );

        const io = req.app.get("io");

        if (io) {
            io.to(chatId.toString()).emit(
                "chatRead",
                {
                    chatId,
                    userId
                }
            );
        }

        res.status(200).json({
            message: "Chat marked as read"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        if (!content?.trim()) {
            return res.status(400).json({
                message: "Message cannot be empty"
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: "Message not found"
            });
        }

        // Only sender can edit
        if (
            message.sender.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                message: "You can only edit your own messages"
            });
        }

        message.content = content.trim();
        message.edited = true;

        await message.save();

        const fullMessage =
            await Message.findById(message._id)
                .populate("sender", "name email avatar")
                .populate("chat")
                .populate({
                    path: "replyTo",
                    populate: {
                        path: "sender",
                        select: "name avatar"
                    }
                });

        res.status(200).json(fullMessage);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

const togglePinMessage = async (req, res) => {
    try {

        const { messageId } = req.params;

        const message =
            await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: "Message not found"
            });
        }

        message.pinned =
            !message.pinned;

        message.pinnedAt =
            message.pinned
                ? new Date()
                : null;

        message.pinnedBy =
            message.pinned
                ? req.user.id
                : null;

        await message.save();

        const fullMessage =
            await Message.findById(
                message._id
            )
                .populate(
                    "sender",
                    "name email"
                )
                .populate("chat");

        const io =
            req.app.get("io");

        if (io) {

            io.to(
                message.chat._id.toString()
            ).emit(
                "messagePinUpdated",
                fullMessage
            );
        }

        res.status(200).json(
            fullMessage
        );

    } catch (error) {

        console.error(
            "Toggle pin error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message =
            await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: "Message not found"
            });
        }

        // Only sender can delete
        if (
            message.sender.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                message: "You can only delete your own messages"
            });
        }

        message.content = "This message was deleted";
        message.deleted = true;

        await message.save();

        const fullMessage =
            await Message.findById(message._id)
                .populate("sender", "name email avatar")
                .populate("chat");

        res.status(200).json(fullMessage);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


    const toggleReaction = async (req, res) => {

    try {

        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        if (!emoji) {
            return res.status(400).json({
                message: "Emoji is required"
            });
        }

        const message =
            await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: "Message not found"
            });
        }

        const existingReaction =
            message.reactions.find(
                (reaction) =>
                    reaction.user.toString() ===
                        userId.toString() &&
                    reaction.emoji === emoji
            );

        if (existingReaction) {

            message.reactions =
                message.reactions.filter(
                    (reaction) =>
                        !(
                            reaction.user.toString() ===
                                userId.toString() &&
                            reaction.emoji === emoji
                        )
                );

        } else {

            // Remove previous reaction by this user
            message.reactions =
                message.reactions.filter(
                    (reaction) =>
                        reaction.user.toString() !==
                        userId.toString()
                );

            message.reactions.push({
                user: userId,
                emoji
            });

        }

        await message.save();

        const fullMessage =
            await Message.findById(message._id)
                .populate("sender", "name email avatar")
                .populate("chat")
                .populate({
                    path: "replyTo",
                    populate: {
                        path: "sender",
                        select: "name avatar"
                    }
                })
                .populate(
                    "reactions.user",
                    "name avatar"
                );

        const io = req.app.get("io");

        if (io) {

            io.to(message.chat.toString()).emit(
                "messageReactionUpdated",
                fullMessage
            );

        }

        res.status(200).json(fullMessage);

    } catch (error) {

        console.error(
            "Reaction error:",
            error
        );

        res.status(500).json({
            message: error.message
        });

    }
};

     const uploadMessageFile = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Please select a file"
            });
        }

        const { chatId } = req.body;

        if (!chatId) {
            return res.status(400).json({
                message: "Chat ID is required"
            });
        }

        // Make sure user belongs to chat
        const chat = await Chat.findOne({
            _id: chatId,
            participants: req.user.id
        });

        if (!chat) {
            return res.status(403).json({
                message: "You are not a member of this chat"
            });
        }

        let messageType = "file";

        if (
            req.file.mimetype.startsWith("image/")
        ) {
            messageType = "image";
        }

        else if (
            req.file.mimetype.startsWith("video/")
        ) {
            messageType = "video";
        }

        else if (
            req.file.mimetype.startsWith("audio/")
        ) {
            messageType = "audio";
        }

        const uploadResult =
            await new Promise((resolve, reject) => {

                const stream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder: "chatverse/messages",

                            resource_type:
                                messageType === "video" ||
                                messageType === "audio"
                                    ? "video"
                                    : "auto"
                        },

                        (error, result) => {

                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }

                        }
                    );

                stream.end(req.file.buffer);
            });

        const message =
            await Message.create({

                sender: req.user.id,

                
                    content:
    messageType === "image"
        ? "📷 Photo"
        : messageType === "video"
            ? "🎥 Video"
            : messageType === "audio"
                ? "🎙️ Voice message"
                : `📄 ${req.file.originalname}`,

                chat: chatId,

                messageType,

                fileUrl:
                    uploadResult.secure_url,

                fileName:
                    req.file.originalname,

                fileSize:
                    req.file.size,

                filePublicId:
                    uploadResult.public_id,

                mimeType:
                    req.file.mimetype
            });

        const fullMessage =
            await Message.findById(message._id)
                .populate(
                    "sender",
                    "name email avatar"
                )
                .populate("chat");

        await Chat.findByIdAndUpdate(
            chatId,
            {
                latestMessage: message._id
            }
        );

        const io = req.app.get("io");

        if (io) {

            io.to(chatId.toString()).emit(
                "newMessage",
                fullMessage
            );

        }

        res.status(201).json(fullMessage);

    } catch (error) {

        console.error(
            "Message upload error:",
            error
        );

        res.status(500).json({
            message: error.message
        });

    }
};

module.exports = {sendMessage, allMessage, markChatRead, editMessage, deleteMessage, toggleReaction, uploadMessageFile, togglePinMessage};