import { useMemo, useState } from "react";
import { BarChart3, Check } from "lucide-react";
import api from "../services/api";

function PollCard({
    poll,
    currentUserId
}) {

    const [selectedOption, setSelectedOption] =
        useState(null);
        const [localPoll, setLocalPoll] =
    useState(poll);

    const [voting, setVoting] =
        useState(false);

    const totalVotes = useMemo(() => {

        return localPoll.options.reduce(
            (total, option) =>
                total + option.votes.length,
            0
        );

    }, [localPoll]);

    const hasVoted = localPoll.options.some(
        option =>
            option.votes.some(
                userId =>
                    userId.toString() ===
                    currentUserId?.toString()
            )
    );

    const vote = async (optionId) => {

    if (voting || hasVoted) {
        return;
    }

    // Save current state in case API fails
    const previousPoll = localPoll;

    // Immediately update UI
    const updatedPoll = {
        ...localPoll,
        options: localPoll.options.map(
            (option) => {

                if (option._id !== optionId) {
                    return option;
                }

                return {
                    ...option,
                    votes: [
                        ...option.votes,
                        currentUserId
                    ]
                };
            }
        )
    };

    setLocalPoll(updatedPoll);
    setSelectedOption(optionId);

    try {

        setVoting(true);

        const response = await api.post(
            `/poll/${localPoll._id}/vote`,
            {
                optionId
            }
        );

        // Use server's final state
        setLocalPoll(response.data);

    } catch (error) {

        console.error(
            "Vote error:",
            error
        );

        // Roll back optimistic update
        setLocalPoll(previousPoll);
        setSelectedOption(null);

        alert(
            error.response?.data?.message ||
            "Failed to vote"
        );

    } finally {

        setVoting(false);

    }
};

    return (
        <div className="
            w-full
            max-w-sm
            rounded-2xl
            bg-white
            border
            border-slate-200
            shadow-sm
            overflow-hidden
        ">

            {/* HEADER */}

            <div className="
                px-4
                py-4
                border-b
                border-slate-100
                flex
                items-center
                gap-3
            ">

                <div className="
                    h-10
                    w-10
                    rounded-xl
                    bg-indigo-100
                    text-indigo-600
                    flex
                    items-center
                    justify-center
                ">
                    <BarChart3 size={20} />
                </div>

                <div>

                    <p className="
                        text-xs
                        font-semibold
                        text-indigo-600
                        uppercase
                    ">
                        Poll
                    </p>

                    <h3 className="
                        font-semibold
                        text-slate-800
                    ">
                        {localPoll.question}
                    </h3>

                </div>

            </div>


            {/* OPTIONS */}

            <div className="p-4 space-y-2">

                {poll.options.map(
                    (option) => {

                        const votes =
                            option.votes.length;

                        const percentage =
                            totalVotes === 0
                                ? 0
                                : Math.round(
                                    (votes /
                                        totalVotes) *
                                    100
                                );

                        const isSelected =
                            selectedOption ===
                            option._id;

                        return (
                            <button
                                key={option._id}
                                type="button"
                                disabled={
                                    hasVoted ||
                                    voting
                                }
                                onClick={() =>
                                    vote(
                                        option._id
                                    )
                                }
                                className="
                                    relative
                                    w-full
                                    overflow-hidden
                                    rounded-xl
                                    border
                                    border-slate-200
                                    text-left
                                    transition
                                    hover:border-indigo-300
                                    disabled:cursor-default
                                "
                            >

                                {/* RESULT BAR */}

                                {hasVoted && (
                                    <div
                                        className="
                                            absolute
                                            inset-y-0
                                            left-0
                                            bg-indigo-50
                                        "
                                        style={{
                                            width:
                                                `${percentage}%`
                                        }}
                                    />
                                )}


                                <div className="
                                    relative
                                    px-4
                                    py-3
                                    flex
                                    items-center
                                    justify-between
                                ">

                                    <div className="
                                        flex
                                        items-center
                                        gap-3
                                    ">

                                        <div className={`
                                            h-5
                                            w-5
                                            rounded-full
                                            border
                                            flex
                                            items-center
                                            justify-center
                                            ${
                                                isSelected ||
                                                hasVoted &&
                                                option.votes.some(
                                                    userId =>
                                                        userId.toString() ===
                                                        currentUserId?.toString()
                                                )
                                                    ? "border-indigo-600 bg-indigo-600 text-white"
                                                    : "border-slate-300"
                                            }
                                        `}>

                                            {(isSelected ||
                                                hasVoted &&
                                                option.votes.some(
                                                    userId =>
                                                        userId.toString() ===
                                                        currentUserId?.toString()
                                                )) && (
                                                <Check
                                                    size={12}
                                                />
                                            )}

                                        </div>

                                        <span className="
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        ">
                                            {option.text}
                                        </span>

                                    </div>


                                    {hasVoted && (
                                        <span className="
                                            text-xs
                                            font-semibold
                                            text-slate-500
                                        ">
                                            {percentage}%
                                        </span>
                                    )}

                                </div>

                            </button>
                        );
                    }
                )}

            </div>


            {/* FOOTER */}

            <div className="
                px-4
                pb-4
                text-xs
                text-slate-400
            ">
                {totalVotes}{" "}
                {totalVotes === 1
                    ? "vote"
                    : "votes"}
            </div>

        </div>
    );
}

export default PollCard;