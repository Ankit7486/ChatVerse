const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const createGroupSystemMessage = async ({
    chatId,
    senderId,
    content,
    action,
    data = {}
}) => {

    const message = await Message.create({
        sender: senderId,
        chat: chatId,
        content,
        messageType: "system",
        systemAction: action,
        systemData: data
    });

    // Make system message the latest message
    await Chat.findByIdAndUpdate(chatId, {
        latestMessage: message._id
    });

    const fullMessage =
        await Message.findById(message._id)
            .populate("sender", "name email")
            .populate("chat");

    return fullMessage;
};

const accessChat = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if(!userId) {
            return res.status(400).json ({
                message : "User ID is required"
            });
        }

        const existingChat = await Chat.findOne({
            isGroupChat : false,
            participants : {
                $all : [req.user.id, userId]
            }
        })
        .populate("participants", "-password")
        .populate("latestMessage");

        if(existingChat) {
            return res.status(200).json(existingChat);
        }

        const newChat = await Chat.create({
            participants : [
                req.user.id,
                userId
            ]
        });

        const fullChat = await Chat.findById(newChat._id)
        .populate("participants", "-password");

        res.status(201).json(fullChat);
    }

    catch (error) {
        res.status(500).json({
            message : error.message
        });
    }
};

const createGroupChat = async (req, res) => {
    try {

        const {
            name,
            participantIds,
            groupAvatar
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Group name is required"
            });
        }

        if (
            !Array.isArray(participantIds) ||
            participantIds.length < 1
        ) {
            return res.status(400).json({
                message:
                    "At least one participant is required"
            });
        }

        // Remove duplicate users
        const uniqueParticipants = [
            ...new Set(
                participantIds.map(
                    id => id.toString()
                )
            )
        ];

        // Add creator
        const participants = [
            req.user.id,
            ...uniqueParticipants.filter(
                id =>
                    id !== req.user.id.toString()
            )
        ];

        if (participants.length < 2) {
            return res.status(400).json({
                message:
                    "A group needs at least 2 members"
            });
        }

        const groupChat = await Chat.create({
            participants,
            isGroupChat: true,
            chatName: name.trim(),
            groupAdmin: req.user.id,
            groupAvatar: groupAvatar || ""
        });

        const creator =
    await User.findById(req.user.id)
        .select("name");

const systemMessage =
    await createGroupSystemMessage({
        chatId: groupChat._id,
        senderId: req.user.id,
        content: `${creator?.name || "Someone"} created the group`,
        action: "group_created",
        data: {
            userId: req.user.id,
            userName: creator?.name || "Someone"
        }
    });

const io = req.app.get("io");

if (io) {
    io.to(groupChat._id.toString()).emit(
        "newMessage",
        systemMessage
    );
} 

        const fullGroupChat =
            await Chat.findById(groupChat._id)
                .populate(
                    "participants",
                    "-password"
                )
                .populate(
                    "groupAdmin",
                    "-password"
                );

        res.status(201).json(
            fullGroupChat
        );

    } catch (error) {

        console.error(
            "Create group error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};

const addGroupMembers = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { memberIds } = req.body;

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({
                message: "Select at least one member"
            });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        if (!chat.isGroupChat) {
            return res.status(400).json({
                message: "This is not a group chat"
            });
        }

        if (
            chat.groupAdmin.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                message: "Only group admin can add members"
            });
        }

        const existingIds = chat.participants.map(
            id => id.toString()
        );

        const newMembers = memberIds.filter(
            id => !existingIds.includes(id.toString())
        );

        if (newMembers.length === 0) {
            return res.status(400).json({
                message: "Selected users are already members"
            });
        }

        chat.participants.push(...newMembers);

        await chat.save();

        const addedUsers =
    await User.find({
        _id: { $in: newMembers }
    }).select("name");

const addedNames =
    addedUsers.map(user => user.name);

const addedText =
    addedNames.length === 1
        ? `${addedNames[0]} was added to the group`
        : `${addedNames.join(", ")} were added to the group`;

const systemMessage =
    await createGroupSystemMessage({
        chatId: chat._id,
        senderId: req.user.id,
        content: addedText,
        action: "member_added",
        data: {
            userIds: newMembers,
            userNames: addedNames,
            addedBy: req.user.id
        }
    });

    const io = req.app.get("io");

if (io) {
    io.to(chat._id.toString()).emit(
        "newMessage",
        systemMessage
    );
}

        const updatedGroup = await Chat.findById(chat._id)
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");


        if (io) {
            io.to(chat._id.toString()).emit(
                "groupUpdated",
                updatedGroup
            );
        }

        res.status(200).json(updatedGroup);

    } catch (error) {
        console.error(
            "Add group members error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};

  const removeGroupMember = async (req, res) => {
    try {
        const { chatId, memberId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        if (!chat.isGroupChat) {
            return res.status(400).json({
                message: "This is not a group chat"
            });
        }

        // Only group admin can remove members
        if (
            chat.groupAdmin?.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                message: "Only group admin can remove members"
            });
        }

        // Admin cannot remove himself
        if (
            memberId.toString() ===
            userId.toString()
        ) {
            return res.status(400).json({
                message: "Group admin cannot remove himself"
            });
        }

        // Check member exists
        const isMember = chat.participants.some(
            member =>
                member.toString() ===
                memberId.toString()
        );

        if (!isMember) {
            return res.status(400).json({
                message: "User is not a member of this group"
            });
        }

        // Remove member
        chat.participants =
            chat.participants.filter(
                member =>
                    member.toString() !==
                    memberId.toString()
            );

        await chat.save();

        const removedUser =
    await User.findById(memberId)
        .select("name");

const removedName =
    removedUser?.name || "A member";

const systemMessage =
    await createGroupSystemMessage({
        chatId: chat._id,
        senderId: userId,
        content: `${removedName} was removed from the group`,
        action: "member_removed",
        data: {
            userId: memberId,
            userName: removedName,
            removedBy: userId
        }
    });

        const updatedChat =
            await Chat.findById(chat._id)
                .populate(
                    "participants",
                    "-password"
                )
                .populate(
                    "groupAdmin",
                    "-password"
                )
                .populate("latestMessage");

        // Notify everyone
        const io = req.app.get("io");

        if (io) {

            io.to(chat._id.toString()).emit(
    "newMessage",
    systemMessage
);

            io.to(chat._id.toString()).emit(
                "groupUpdated",
                updatedChat
            );
        }

        // Notify removed user separately
        if (io) {
            io.to(memberId.toString()).emit(
                "removedFromGroup",
                {
                    chatId: chat._id.toString()
                }
            );
        }

        return res.status(200).json(updatedChat);

    } catch (error) {

        console.error(
            "Remove group member error:",
            error
        );

        return res.status(500).json({
            message: error.message
        });
    }
};

const updateGroupPermissions = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { onlyAdminsCanSend } = req.body;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            isGroupChat: true,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Only admin can change group permissions
        if (
            !chat.groupAdmin ||
            chat.groupAdmin.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only group admin can change permissions"
            });
        }

        chat.onlyAdminsCanSend =
            Boolean(onlyAdminsCanSend);

        await chat.save();

        const updatedGroup =
            await Chat.findById(chat._id)
                .populate(
                    "participants",
                    "-password"
                )
                .populate(
                    "groupAdmin",
                    "-password"
                )
                .populate("latestMessage");

        const io = req.app.get("io");

        if (io) {
            io.to(chat._id.toString()).emit(
                "groupUpdated",
                updatedGroup
            );
        }

        return res.status(200).json(
            updatedGroup
        );

    } catch (error) {

        console.error(
            "Update group permissions error:",
            error
        );

        return res.status(500).json({
            message: error.message
        });
    }
};

const transferGroupAdmin = async (req, res) => {
    try {
        const { chatId, newAdminId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            isGroupChat: true,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Only current admin can transfer ownership
        if (
            !chat.groupAdmin ||
            chat.groupAdmin.toString() !== userId.toString()
        ) {
            return res.status(403).json({
                message: "Only current admin can transfer admin"
            });
        }

        // Cannot transfer to yourself
        if (newAdminId.toString() === userId.toString()) {
            return res.status(400).json({
                message: "You are already the admin"
            });
        }

        // New admin must already be a member
        const isMember = chat.participants.some(
            member =>
                member.toString() === newAdminId.toString()
        );

        if (!isMember) {
            return res.status(400).json({
                message: "User is not a member of this group"
            });
        }

        // Transfer ownership
        chat.groupAdmin = newAdminId;

        await chat.save();

        const updatedGroup =
            await Chat.findById(chat._id)
                .populate("participants", "-password")
                .populate("groupAdmin", "-password")
                .populate("latestMessage");

        const io = req.app.get("io");

        if (io) {
            io.to(chat._id.toString()).emit(
                "groupUpdated",
                updatedGroup
            );
        }

        return res.status(200).json(updatedGroup);

    } catch (error) {
        console.error(
            "Transfer admin error:",
            error
        );

        return res.status(500).json({
            message: error.message
        });
    }
};

const fetchChats = async (req, res) => {
    try {
        const chats = await Chat.find({
            participants : req.user.id
        })
        .populate("participants", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1});

        const userId =
    req.user.id.toString();

chats.sort((a, b) => {

    const aPinned =
        a.pinnedBy?.some(
            id =>
                id.toString() === userId
        );

    const bPinned =
        b.pinnedBy?.some(
            id =>
                id.toString() === userId
        );

    if (aPinned && !bPinned) {
        return -1;
    }

    if (!aPinned && bPinned) {
        return 1;
    }

    return (
        new Date(b.updatedAt) -
        new Date(a.updatedAt)
    );

});

        await Chat.populate(chats, {
            path : "latestMessage.sender",
            select : "name email"
        });
        res.status(200).json(chats);
    }
    
    catch (error) {
        res.status(500).json({
            message : error.message
        });
    }
};


const togglePinChat = async (req, res) => {

    try {

        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        const alreadyPinned =
            chat.pinnedBy.some(
                id => id.toString() === userId.toString()
            );

        if (alreadyPinned) {

            chat.pinnedBy =
                chat.pinnedBy.filter(
                    id =>
                        id.toString() !==
                        userId.toString()
                );

        } else {

            chat.pinnedBy.push(userId);

        }

        await chat.save();

        res.status(200).json({
            message: alreadyPinned
                ? "Chat unpinned"
                : "Chat pinned",

            pinned: !alreadyPinned
        });

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

  const toggleMuteChat = async (req, res) => {

    try {

        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        const alreadyMuted =
            chat.mutedBy.some(
                id => id.toString() === userId.toString()
            );

        if (alreadyMuted) {

            chat.mutedBy =
                chat.mutedBy.filter(
                    id =>
                        id.toString() !==
                        userId.toString()
                );

        } else {

            chat.mutedBy.push(userId);

        }

        await chat.save();

        res.status(200).json({
            message: alreadyMuted
                ? "Notifications unmuted"
                : "Notifications muted",

            muted: !alreadyMuted
        });

    } catch (error) {

        console.error(
            "Toggle mute error:",
            error
        );

        res.status(500).json({
            message: error.message
        });

    }
};

const archiveChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        if (!chat.archivedBy.includes(userId)) {
            chat.archivedBy.push(userId);
        }

        await chat.save();

        res.json({
            message: "Chat archived"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};

const unarchiveChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        chat.archivedBy =
            chat.archivedBy.filter(
                id =>
                    id.toString() !==
                    userId.toString()
            );

        await chat.save();

        res.json({
            message: "Chat unarchived"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};

const toggleArchiveChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        const alreadyArchived =
            chat.archivedBy?.some(
                id =>
                    id.toString() ===
                    userId.toString()
            );

        if (alreadyArchived) {

            chat.archivedBy =
                chat.archivedBy.filter(
                    id =>
                        id.toString() !==
                        userId.toString()
                );

        } else {

            if (!chat.archivedBy) {
                chat.archivedBy = [];
            }

            chat.archivedBy.push(userId);
        }

        await chat.save();

        res.status(200).json({
            message: alreadyArchived
                ? "Chat unarchived"
                : "Chat archived",
            archived: !alreadyArchived
        });

    } catch (error) {

        console.error(
            "Archive chat error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};

const deleteChat = async (req, res) => {

    try {

        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {

            return res.status(404).json({
                message: "Chat not found"
            });

        }

        // Remove the chat for this user only
        chat.participants =
            chat.participants.filter(
                id =>
                    id.toString() !==
                    userId.toString()
            );

        // If nobody remains, delete the chat
        if (chat.participants.length === 0) {

            await Chat.findByIdAndDelete(
                chatId
            );

        } else {

            await chat.save();

        }

        res.status(200).json({
            message: "Chat deleted"
        });

    } catch (error) {

        console.error(
            "Delete chat error:",
            error
        );

        res.status(500).json({
            message: error.message
        });

    }
};

const updateGroupInfo = async (req, res) => {

    try {

        const { chatId } = req.params;

        const {
            chatName,
            groupDescription,
            groupAvatar
        } = req.body;

        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            isGroupChat: true
        });

        if (!chat) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const adminId =
            chat.groupAdmin?.toString();

        if (
            adminId !==
            userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only group admin can edit group information"
            });
        }

        const oldGroupName =
    chat.chatName;

const oldGroupDescription =
    chat.groupDescription;

const oldGroupAvatar =
    chat.groupAvatar;

        if (chatName !== undefined) {
            chat.chatName =
                chatName.trim();
        }

        if (groupDescription !== undefined) {
            chat.groupDescription =
                groupDescription.trim();
        }

        if (groupAvatar !== undefined) {
            chat.groupAvatar =
                groupAvatar.trim();
        }

        await chat.save();

        const changes = [];

if (
    chatName !== undefined &&
    chatName.trim() !== oldGroupName
) {
    changes.push("name");
}

if (
    groupDescription !== undefined &&
    groupDescription.trim() !== oldGroupDescription
) {
    changes.push("description");
}

if (
    groupAvatar !== undefined &&
    groupAvatar.trim() !== oldGroupAvatar
) {
    changes.push("photo");
}

let systemMessage = null;

if (changes.length > 0) {

    let content =
        "Group information was updated";

    if (
        changes.length === 1 &&
        changes[0] === "name"
    ) {
        content =
            `${chat.chatName} is now the group name`;
    } else if (
        changes.length === 1 &&
        changes[0] === "photo"
    ) {
        content =
            "Group photo was changed";
    } else if (
        changes.length === 1 &&
        changes[0] === "description"
    ) {
        content =
            "Group description was changed";
    }

    systemMessage =
        await createGroupSystemMessage({
            chatId: chat._id,
            senderId: userId,
            content,
            action: "group_updated",
            data: {
                changes
            }
        });
}

        const updatedGroup =
            await Chat.findById(chat._id)
                .populate(
                    "participants",
                    "-password"
                )
                .populate(
                    "groupAdmin",
                    "-password"
                )
                .populate("latestMessage");

        const io = req.app.get("io");

        if (io && systemMessage) {
    io.to(chat._id.toString()).emit(
        "newMessage",
        systemMessage
    );
}

        if (io) {
            io.to(chat._id.toString()).emit(
                "groupUpdated",
                updatedGroup
            );
        }

        return res.status(200).json(
            updatedGroup
        );

    } catch (error) {

        console.error(
            "Update group info error:",
            error
        );

        return res.status(500).json({
            message: error.message
        });
    }
};

const createAnnouncement = async (req, res) => {

    try {

        const { chatId } = req.params;
        const { content } = req.body;

        const userId = req.user.id;

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "Announcement cannot be empty"
            });
        }

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            isGroupChat: true
        });

        if (!chat) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Only admin can create announcement
        if (
            chat.groupAdmin?.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only group admin can create announcements"
            });
        }

        chat.announcement = {
            content: content.trim(),
            createdBy: userId,
            createdAt: new Date(),
            isActive: true
        };

        await chat.save();

        const updatedGroup =
            await Chat.findById(chat._id)
                .populate(
                    "participants",
                    "-password"
                )
                .populate(
                    "groupAdmin",
                    "-password"
                )
                .populate(
                    "announcement.createdBy",
                    "name avatar"
                )
                .populate("latestMessage");

        const io = req.app.get("io");

        if (io) {
            io.to(chat._id.toString()).emit(
                "groupUpdated",
                updatedGroup
            );
        }

        return res.status(200).json(
            updatedGroup
        );

    } catch (error) {

        console.error(
            "Create announcement error:",
            error
        );

        return res.status(500).json({
            message: error.message
        });
    }
};

const deleteAnnouncement = async (req, res) => {

    try {

        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            isGroupChat: true
        });

        if (!chat) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        if (
            chat.groupAdmin?.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only group admin can remove announcement"
            });
        }

        chat.announcement = {
            content: "",
            createdBy: null,
            createdAt: null,
            isActive: false
        };

        await chat.save();

        const updatedGroup =
            await Chat.findById(chat._id)
                .populate(
                    "participants",
                    "-password"
                )
                .populate(
                    "groupAdmin",
                    "-password"
                )
                .populate(
                    "announcement.createdBy",
                    "name avatar"
                )
                .populate("latestMessage");

        const io = req.app.get("io");

        if (io) {
            io.to(chat._id.toString()).emit(
                "groupUpdated",
                updatedGroup
            );
        }

        return res.status(200).json(
            updatedGroup
        );

    } catch (error) {

        console.error(
            "Delete announcement error:",
            error
        );

        return res.status(500).json({
            message: error.message
        });
    }
};

const uploadGroupAvatar = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                message: "Please select an image"
            });
        }

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            isGroupChat: true
        });

        if (!chat) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Only group admin can change DP
        if (
            chat.groupAdmin?.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                message: "Only group admin can change group DP"
            });
        }

        // Upload to Cloudinary
        const uploadResult = await new Promise(
            (resolve, reject) => {
                const stream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder: "chatverse/groups",
                            resource_type: "image"
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
            }
        );

        // Save new avatar URL
        chat.groupAvatar =
            uploadResult.secure_url;

            const systemMessage =
    await createGroupSystemMessage({
        chatId: chat._id,
        senderId: userId,
        content: "Group photo was changed",
        action: "group_photo_changed",
        data: {
            changedBy: userId
        }
    });

        await chat.save();

        // Get complete updated group
        const updatedGroup =
            await Chat.findById(chat._id)
                .populate(
                    "participants",
                    "-password"
                )
                .populate(
                    "groupAdmin",
                    "-password"
                )
                .populate("latestMessage");

        // Notify all group members
        const io = req.app.get("io");

        if (io) {

            io.to(chat._id.toString()).emit(
        "newMessage",
        systemMessage
    );

            io.to(chat._id.toString()).emit(
                "groupUpdated",
                updatedGroup
            );
        }

        return res.status(200).json(
            updatedGroup
        );

    } catch (error) {
        console.error(
            "Upload group avatar error:",
            error
        );

        return res.status(500).json({
            message: error.message
        });
    }
};

 const leaveGroup = async (req, res) => {

    try {

        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
            isGroupChat: true
        });

        if (!chat) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const leavingUserId =
            userId.toString();

        chat.participants =
            chat.participants.filter(
                id =>
                    id.toString() !==
                    leavingUserId
            );

        /*
         * If admin leaves:
         * transfer admin role to
         * the first remaining member.
         */
        if (
            chat.groupAdmin &&
            chat.groupAdmin.toString() ===
            leavingUserId
        ) {

            if (chat.participants.length > 0) {

                chat.groupAdmin =
                    chat.participants[0];

            } else {

                await Chat.findByIdAndDelete(
                    chatId
                );

                return res.status(200).json({
                    message:
                        "Group deleted because no members remain"
                });
            }
        }

        await chat.save();

        const systemMessage =
    await createGroupSystemMessage({
        chatId: chat._id,
        senderId: userId,
        content: `${leavingName} left the group`,
        action: "member_left",
        data: {
            userId,
            userName: leavingName
        }
    });

        const leavingUser =
    await User.findById(userId)
        .select("name");

const leavingName =
    leavingUser?.name || "A member";

        const updatedGroup =
            await Chat.findById(chat._id)
                .populate(
                    "participants",
                    "-password"
                )
                .populate(
                    "groupAdmin",
                    "-password"
                )
                .populate("latestMessage");

        const io = req.app.get("io");

        if (io) {

            io.to(chat._id.toString()).emit(
        "newMessage",
        systemMessage
    );

            io.to(chat._id.toString()).emit(
                "groupUpdated",
                updatedGroup
            );

            io.to(userId.toString()).emit(
                "leftGroup",
                {
                    chatId: chat._id.toString()
                }
            );
        }

        return res.status(200).json({
            message: "You left the group",
            group: updatedGroup
        });

    } catch (error) {

        console.error(
            "Leave group error:",
            error
        );

        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    accessChat,
    createGroupChat,
    addGroupMembers,
    removeGroupMember,
    fetchChats,
    togglePinChat,
    toggleMuteChat,
    toggleArchiveChat,
    archiveChat,
    unarchiveChat,
    deleteChat,
    updateGroupInfo,
    leaveGroup,
    uploadGroupAvatar,
    createAnnouncement,
    deleteAnnouncement,
    transferGroupAdmin,
    updateGroupPermissions
};