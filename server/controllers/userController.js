const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const uploadAvatar = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Please select an image"
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const uploadResult =
            await new Promise((resolve, reject) => {

                const stream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder: "chatverse/avatars",
                            resource_type: "image",
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

        user.avatar = uploadResult.secure_url;
        user.avatarPublicId = uploadResult.public_id;

        await user.save();

        res.status(200).json({
            message: "Profile picture updated",
            avatar: user.avatar
        });

    } catch (error) {

        console.error(
            "Avatar upload error:",
            error
        );

        res.status(500).json({
            message: error.message
        });

    }
};

const searchUsers = async (req, res) => {
    try {
        const { search = "" } = req.query;

        const keyword = search.trim();

        // Don't return every user when search is empty
        if (!keyword) {
            return res.status(200).json([]);
        }

        const users = await User.find({
            _id: {
                $ne: req.user.id
            },

            $or: [
                {
                    name: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: keyword,
                        $options: "i"
                    }
                }
            ]
        })
        .select("name email lastSeen avatar about");

        res.status(200).json(users);

    } catch (error) {

        console.error("Search users error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};
    const updateProfile = async (req, res) => {
        try {
            const { name, about, avatar } = req.body;
    
            const user = await User.findById(req.user.id);
    
            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }
    
            if (name?.trim()) {
                user.name = name.trim();
            }
    
            if (about !== undefined) {
                user.about = about.trim();
            }
    
            if (avatar !== undefined) {
                user.avatar = avatar;
            }
    
            await user.save();
    
            res.status(200).json({
                message: "Profile updated successfully",
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    about: user.about
                }
            });
    
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    };

    const removeAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

         // Delete actual image from Cloudinary
        if (user.avatarPublicId) {

            await cloudinary.uploader.destroy(
                user.avatarPublicId
            );

        }

        user.avatar = "";
        user.avatarPublicId = "";
        await user.save();

        res.status(200).json({
            message: "Profile picture removed",
            avatar: ""
        });

    } catch (error) {
        console.error("Remove avatar error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};
    

module.exports = {searchUsers, updateProfile, uploadAvatar, removeAvatar};