const Poll = require("../models/Poll");

const createPoll = async (req, res) => {
    try {
        const {
            chatId,
            question,
            options,
            multipleAnswers
        } = req.body;

        if (!chatId || !question?.trim()) {
            return res.status(400).json({
                message: "Question and chat are required"
            });
        }

        if (
            !Array.isArray(options) ||
            options.length < 2
        ) {
            return res.status(400).json({
                message:
                    "At least 2 options are required"
            });
        }

        const cleanOptions = options
            .map(option => ({
                text: option.trim(),
                votes: []
            }))
            .filter(option => option.text);

        if (cleanOptions.length < 2) {
            return res.status(400).json({
                message:
                    "At least 2 valid options are required"
            });
        }

        const poll = await Poll.create({
            chatId,
            createdBy: req.user.id,
            question: question.trim(),
            options: cleanOptions,
            multipleAnswers:
                !!multipleAnswers
        });

        const populatedPoll =
            await Poll.findById(poll._id)
                .populate(
                    "createdBy",
                    "name avatar"
                );

                if (req.io) {
    req.io
        .to(chatId.toString())
        .emit(
            "pollCreated",
            populatedPoll
        );
}

        res.status(201).json(
            populatedPoll
        );

    } catch (error) {
        console.error(
            "Create poll error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to create poll"
        });
    }
};


const votePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const { optionId } = req.body;

        const poll =
            await Poll.findById(pollId);

        if (!poll) {
            return res.status(404).json({
                message: "Poll not found"
            });
        }

        if (!optionId) {
            return res.status(400).json({
                message:
                    "Option ID is required"
            });
        }

        if (!poll.multipleAnswers) {
            poll.options.forEach(option => {
                option.votes =
                    option.votes.filter(
                        userId =>
                            userId.toString() !==
                            req.user.id.toString()
                    );
            });
        }

        const selectedOption =
            poll.options.id(optionId);

        if (!selectedOption) {
            return res.status(404).json({
                message:
                    "Poll option not found"
            });
        }

        const alreadyVoted =
            selectedOption.votes.some(
                userId =>
                    userId.toString() ===
                    req.user.id.toString()
            );

        if (!alreadyVoted) {
            selectedOption.votes.push(
                req.user.id
            );
        }

        await poll.save();

        const updatedPoll =
            await Poll.findById(poll._id)
                .populate(
                    "createdBy",
                    "name avatar"
                );

        if (req.io) {
            req.io
                .to(poll.chatId.toString())
                .emit(
                    "pollUpdated",
                    updatedPoll
                );
        }

        res.json(updatedPoll);

    } catch (error) {
        console.error(
            "Vote poll error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to vote"
        });
    }
};

const getChatPolls = async (req, res) => {
    try {
        const { chatId } = req.params;

        const polls = await Poll.find({
            chatId
        })
            .populate("createdBy", "name avatar")
            .sort({ createdAt: 1 });

        res.json(polls);

    } catch (error) {
        console.error(
            "Get chat polls error:",
            error
        );

        res.status(500).json({
            message: "Failed to load polls"
        });
    }
};


module.exports = {
    createPoll,
    votePoll,
    getChatPolls
};