const Status =
    require("../models/Status");

const cloudinary =
    require("../config/cloudinary");


const createStatus = async (req, res) => {

    try {

        const {
            type = "text",
            content = "",
            background = "indigo"
        } = req.body;


        // =========================
        // VALIDATE
        // =========================

        if (
            type === "text" &&
            !content.trim()
        ) {
            return res.status(400).json({
                message:
                    "Status cannot be empty"
            });
        }


        // =========================
        // IMAGE STATUS
        // =========================

        let mediaUrl = "";


        if (type === "image") {

            if (!req.file) {

                return res.status(400).json({
                    message:
                        "Please select an image"
                });

            }


            const uploadResult =
                await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary
                                .uploader
                                .upload_stream(
                                    {
                                        folder:
                                            "chatverse/status",
                                        resource_type:
                                            "image"
                                    },

                                    (
                                        error,
                                        result
                                    ) => {

                                        if (error) {
                                            reject(error);
                                        } else {
                                            resolve(result);
                                        }

                                    }
                                );

                        stream.end(
                            req.file.buffer
                        );

                    }
                );


            mediaUrl =
                uploadResult.secure_url;
        }


        // =========================
        // CREATE STATUS
        // =========================

        const status =
            await Status.create({

                user: req.user.id,

                type,

                content:
                    content.trim(),

                mediaUrl,

                background,

                expiresAt:
                    new Date(
                        Date.now() +
                        24 *
                        60 *
                        60 *
                        1000
                    )
            });


        // =========================
        // POPULATE USER
        // =========================

        const populatedStatus =
            await Status
                .findById(status._id)
                .populate(
                    "user",
                    "name avatar"
                );


        return res.status(201).json(
            populatedStatus
        );


    } catch (error) {

        console.error(
            "CREATE STATUS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                "Failed to create status"
        });

    }
};

const getMyStatuses = async (req, res) => {

    try {

        const statuses =
            await Status
                .find({
                    user: req.user.id,

                    expiresAt: {
                        $gt: new Date()
                    }
                })
                .populate(
                    "user",
                    "name avatar"
                )
                .sort({
                    createdAt: 1
                });


        return res.status(200).json(
            statuses
        );

    } catch (error) {

        console.error(
            "GET MY STATUS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch statuses"
        });

    }
};

const deleteStatus = async (req, res) => {
    try {
        const status = await Status.findOne({
            _id: req.params.statusId,
            user: req.user.id
        });

        if (!status) {
            return res.status(404).json({
                message: "Status not found"
            });
        }

        await Status.deleteOne({
            _id: status._id
        });

        return res.status(200).json({
            message: "Status deleted successfully",
            statusId: status._id
        });

    } catch (error) {
        console.error(
            "DELETE STATUS ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to delete status"
        });
    }
};

const viewStatus = async (req, res) => {
    try {
        const status = await Status.findOne({
            _id: req.params.statusId,
            expiresAt: {
                $gt: new Date()
            }
        });

        if (!status) {
            return res.status(404).json({
                message: "Status not found"
            });
        }

        const viewerId = req.user.id;

        // Don't count owner as viewer
        if (
            status.user.toString() ===
            viewerId.toString()
        ) {
            return res.status(200).json({
                viewersCount:
                    status.viewers.length
            });
        }

        // Don't add same viewer twice
        const alreadyViewed =
            status.viewers.some(
                id =>
                    id.toString() ===
                    viewerId.toString()
            );

        if (!alreadyViewed) {
            status.viewers.push(viewerId);
            await status.save();
        }

        return res.status(200).json({
            viewersCount:
                status.viewers.length
        });

    } catch (error) {
        console.error(
            "VIEW STATUS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update status view"
        });
    }
};

module.exports = {
    createStatus,
    getMyStatuses,
    deleteStatus,
    viewStatus
};