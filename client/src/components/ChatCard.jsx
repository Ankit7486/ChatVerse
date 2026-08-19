import { useState } from "react";
import {
    MoreVertical,
    Pin,
    PinOff,
    Bell,
    BellOff,
    Archive,
    ArchiveRestore,
    Trash2,
    Users
} from "lucide-react";
import api from "../services/api";

function ChatCard({
    chatId,
    name,
    avatar,
    lastMessage,
    online,
    unreadCount,
    active,
    onClick,
    onRefresh,
    dark,
    pinned = false,
    muted = false,
    archived = false,
    isGroupChat = false
}) {

    const [showMenu, setShowMenu] = useState(false);
    const [loading, setLoading] = useState(false);



    // =========================
    // PIN / UNPIN
    // =========================

    const handlePin = async (e) => {

        e.stopPropagation();

        try {

            setLoading(true);

            await api.patch(
                `/chat/${chatId}/pin`
            );

            setShowMenu(false);

            onRefresh?.();

        } catch (error) {

            console.error(
                "Pin chat error:",
                error
            );

        } finally {

            setLoading(false);
        }
    };


    // =========================
    // MUTE / UNMUTE
    // =========================

    const handleMute = async (e) => {

        e.stopPropagation();

        try {

            setLoading(true);

            await api.patch(
                `/chat/${chatId}/mute`
            );

            setShowMenu(false);

            onRefresh?.();

        } catch (error) {

            console.error(
                "Mute chat error:",
                error
            );

        } finally {

            setLoading(false);
        }
    };
    
    const handleArchive = async (e) => {
    e.stopPropagation();

    try {

        setLoading(true);

        await api.patch(
            `/chat/${chatId}/archive`
        );

        setShowMenu(false);

        onRefresh?.();

    } catch (error) {

        console.error(
            "Archive chat error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to archive chat"
        );

    } finally {

        setLoading(false);

    }
};

    // =========================
    // DELETE CHAT
    // =========================

    const handleDelete = async (e) => {

        e.stopPropagation();

        const confirmed = window.confirm(
            `Delete your chat with ${name || "this user"}?`
        );

        if (!confirmed) return;

        try {

            setLoading(true);

            /*
             * IMPORTANT:
             * This assumes you already have
             * DELETE /chat/:chatId
             * in your backend.
             *
             * If you don't have it yet,
             * don't create it randomly.
             * We'll add it properly next.
             */

            await api.delete(
                `/chat/${chatId}`
            );

            setShowMenu(false);

            onRefresh?.();

        } catch (error) {

            console.error(
                "Delete chat error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to delete chat"
            );

        } finally {

            setLoading(false);
        }
    };


    // =========================
    // LAST MESSAGE
    // =========================



    const getLastMessage = () => {

        return lastMessage ||
            "No messages yet";
    };


    return (
        <div
            className={`
                group
                relative
                flex
                items-center
                gap-3
                px-3
                py-3
                cursor-pointer
                transition
                ${
                    active
                        ? "bg-indigo-50"
                        : "hover:bg-slate-100"
                }
            `}
            onClick={onClick}
        >

            {/* =========================
                AVATAR
               ========================= */}

            <div className="
                relative
                h-12
                w-12
                shrink-0
            ">

                {avatar ? (

                    <img
                        src={avatar}
                        alt={
                            name ||
                            "User"
                        }
                        className="
                            h-12
                            w-12
                            rounded-full
                            object-cover
                        "
                    />

                ) : (

                    <div className="
                        h-12
                        w-12
                        rounded-full
                        bg-gradient-to-br
                        from-indigo-500
                        to-violet-600
                        text-white
                        flex
                        items-center
                        justify-center
                        font-bold
                        text-lg
                    ">
                        {isGroupChat ? (
    <Users size={22} />
) : (
    name?.charAt(0)?.toUpperCase() || "?"
)}
                    </div>

                )}


                {/* ONLINE DOT */}

                {online && (
                    <span className="
                        absolute
                        bottom-0
                        right-0
                        h-3
                        w-3
                        rounded-full
                        bg-emerald-500
                        border-2
                        border-white
                    " />
                )}

            </div>


            {/* =========================
                CHAT INFORMATION
               ========================= */}

            <div className="
                min-w-0
                flex-1
            ">

                <div className="
                    flex
                    items-center
                    gap-1
                ">

                    <h3 className="
                        font-semibold
                        text-sm
                        truncate
                    ">
                        {name ||
                            "Unknown User"}
                    </h3>

                    {pinned && (
                        <Pin
                            size={13}
                            className="
                                shrink-0
                                text-indigo-500
                            "
                        />
                    )}

                </div>


                <p className="
                    text-xs
                    text-slate-500
                    truncate
                    mt-0.5
                ">
                    {getLastMessage()}
                </p>

            </div>


            {/* =========================
                RIGHT SIDE
               ========================= */}

            <div className="
                flex
                flex-col
                items-end
                gap-1
            ">


                {muted && (
                    <BellOff
                        size={13}
                        className="
                            text-slate-400
                        "
                    />
                )}

            </div>


            {/* =========================
                THREE DOT MENU
               ========================= */}

            <button
                type="button"
                onClick={(e) => {

                    e.stopPropagation();

                    setShowMenu(
                        previous =>
                            !previous
                    );
                }}
                disabled={loading}
                className="
                    absolute
                    right-2
                    top-2
                    h-8
                    w-8
                    rounded-lg
                    bg-white
                    shadow-sm
                    border
                    border-slate-200
                    text-slate-500
                    opacity-0
                    group-hover:opacity-100
                    hover:text-slate-800
                    hover:bg-slate-50
                    grid
                    place-items-center
                    transition
                    disabled:opacity-50
                "
                title="Chat options"
            >
                <MoreVertical size={17} />
            </button>


            {/* =========================
                MENU
               ========================= */}

            {showMenu && (
                <div
                    className="
                        absolute
                        right-2
                        top-11
                        z-50
                        w-48
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        shadow-2xl
                        p-1
                    "
                    onClick={(e) =>
                        e.stopPropagation()
                    }
                >

                    {/* PIN */}

                    <button
                        type="button"
                        onClick={handlePin}
                        disabled={loading}
                        className="
                            w-full
                            flex
                            items-center
                            gap-3
                            px-3
                            py-2.5
                            rounded-xl
                            text-sm
                            text-slate-700
                            hover:bg-slate-100
                            transition
                        "
                    >

                        {pinned ? (
                            <PinOff size={16} />
                        ) : (
                            <Pin size={16} />
                        )}

                        {pinned
                            ? "Unpin chat"
                            : "Pin chat"}

                    </button>


                    {/* MUTE */}

                    <button
                        type="button"
                        onClick={handleMute}
                        disabled={loading}
                        className="
                            w-full
                            flex
                            items-center
                            gap-3
                            px-3
                            py-2.5
                            rounded-xl
                            text-sm
                            text-slate-700
                            hover:bg-slate-100
                            transition
                        "
                    >

                        {muted ? (
                            <Bell size={16} />
                        ) : (
                            <BellOff size={16} />
                        )}

                        {muted
                            ? "Unmute notifications"
                            : "Mute notifications"}

                    </button>
       
                    <button
    type="button"
    onClick={handleArchive}
    disabled={loading}
    className="
        w-full
        flex
        items-center
        gap-3
        px-3
        py-2.5
        rounded-xl
        text-sm
        text-slate-700
        hover:bg-slate-100
        transition
    "
>
    {archived ? (
        <ArchiveRestore size={16} />
    ) : (
        <Archive size={16} />
    )}

    {archived
        ? "Unarchive chat"
        : "Archive chat"}
</button>

                    {/* DIVIDER */}

                    <div className="
                        my-1
                        border-t
                        border-slate-100
                    " />


                    {/* DELETE */}

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="
                            w-full
                            flex
                            items-center
                            gap-3
                            px-3
                            py-2.5
                            rounded-xl
                            text-sm
                            text-red-500
                            hover:bg-red-50
                            transition
                        "
                    >

                        <Trash2 size={16} />

                        Delete chat

                    </button>

                </div>
            )}

        </div>
    );
}

export default ChatCard;