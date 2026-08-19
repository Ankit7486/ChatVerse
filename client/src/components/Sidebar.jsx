import { Search, LogOut, MessageCircle, UserRound, User, Settings, Archive, ArrowLeft, Users } from "lucide-react";
import ChatCard from "./ChatCard";
import CreateGroup from "./CreateGroup";
import api from "../services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";

function Sidebar({ selectedChat, setSelectedChat, user, onlineUsers = [] }) {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNewChatMenu, setShowNewChatMenu] =
    useState(false);

const [showCreateGroup, setShowCreateGroup] =
    useState(false);
    const [showStatus, setShowStatus] =
    useState(false);

const [showCreateStatus, setShowCreateStatus] =
    useState(false);

    const [myStatuses, setMyStatuses] =
    useState([]);

const [showStatusViewer, setShowStatusViewer] =
    useState(false);

const [activeStatusIndex, setActiveStatusIndex] =
    useState(0);

    const [deletingStatus, setDeletingStatus] =
    useState(false);

const [statusLoading, setStatusLoading] =
    useState(false);

const [statusType, setStatusType] =
    useState("text");

const [statusContent, setStatusContent] =
    useState("");

const [statusImage, setStatusImage] =
    useState(null);

const [statusImagePreview, setStatusImagePreview] =
    useState("");

const [postingStatus, setPostingStatus] =
    useState(false);
  const navigate = useNavigate();

  const fetchUsers = async () => {

    const keyword = search.trim();

    if (!keyword) {
        setUsers([]);
        setSearchError("");
        return;
    }

    try {

        setSearchLoading(true);
        setSearchError("");

        const response = await api.get(
            `/users?search=${encodeURIComponent(keyword)}`
        );

        setUsers(response.data);

    } catch (error) {

        console.error(
            "User search error:",
            error
        );

        if (error.response?.status === 401) {

            localStorage.removeItem("token");
            navigate("/login", { replace: true });
            return;
        }

        setUsers([]);

        setSearchError(
            error.response?.data?.message ||
            "Unable to search users"
        );

    } finally {

        setSearchLoading(false);

    }
};

const normalChats = chats.filter((chat) => {
    return !chat.archivedBy?.some(
        (id) =>
            id?.toString() ===
            user?._id?.toString()
    );
});

const archivedChats = chats.filter((chat) => {
    return chat.archivedBy?.some(
        (id) =>
            id?.toString() ===
            user?._id?.toString()
    );
});

  const fetchChats = async () => {
    try {
      const response = await api.get("/chat");
      const updatedSelectedChat =
    response.data.find(
        chat =>
            chat._id ===
            selectedChat?._id
    );

if (updatedSelectedChat) {
    setSelectedChat(
        updatedSelectedChat
    );
}
      setChats(response.data);
    } catch (error) {
      console.error("Chat list error:", error);
    }
  };

  const accessChat = async (userId) => {
    try {
      const response = await api.post("/chat", { userId });
      setSelectedChat(response.data);
      setSearch("");
      await fetchChats();
    } catch (error) {
      console.error("Access chat error:", error);
    }
  };

  const handleStatusImageSelect = (event) => {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }


    if (!file.type.startsWith("image/")) {

        alert(
            "Please select an image file"
        );

        return;
    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        alert(
            "Image must be smaller than 5MB"
        );

        return;
    }


    setStatusImage(file);

    setStatusImagePreview(
        URL.createObjectURL(file)
    );

    setStatusType("image");
};

  const handlePostStatus = async () => {

    if (postingStatus) {
        return;
    }


    // =========================
    // TEXT
    // =========================

    if (
        statusType === "text" &&
        !statusContent.trim()
    ) {

        alert(
            "Write something first"
        );

        return;
    }


    // =========================
    // IMAGE
    // =========================

    if (
        statusType === "image" &&
        !statusImage
    ) {

        alert(
            "Please select an image"
        );

        return;
    }


    try {

        setPostingStatus(true);


        const formData =
            new FormData();


        formData.append(
            "type",
            statusType
        );


        formData.append(
            "content",
            statusContent.trim()
        );


        formData.append(
            "background",
            "indigo"
        );


        if (statusType === "image" && statusImage) {

            formData.append(
                "media",
                statusImage
            );

        }


        const response =
            await api.post(
                "/status",
                formData
            );


        console.log(
            "STATUS CREATED:",
            response.data
        );


        // Reset

        setStatusContent("");

        setStatusImage(null);

        setStatusImagePreview("");

        setStatusType("text");

        setShowCreateStatus(false);

        setShowStatus(false);

        await fetchMyStatuses();


        // Optional browser event
        window.dispatchEvent(
            new CustomEvent(
                "chatverse-status-created",
                {
                    detail:
                        response.data
                }
            )
        );


    } catch (error) {

        console.error(
            "POST STATUS ERROR:",
            error
        );


        alert(
            error.response?.data?.message ||
            "Failed to post status"
        );


    } finally {

        setPostingStatus(false);

    }
};

const fetchMyStatuses = async () => {

    try {

        setStatusLoading(true);

        const response =
            await api.get("/status/my");

        setMyStatuses(
            response.data || []
        );

    } catch (error) {

        console.error(
            "FETCH MY STATUS ERROR:",
            error
        );

        setMyStatuses([]);

    } finally {

        setStatusLoading(false);

    }
};

const markStatusViewed = async (statusId) => {

    try {

        const response =
            await api.post(
                `/status/${statusId}/view`
            );

        setMyStatuses(prev =>
            prev.map(status =>
                status._id === statusId
                    ? {
                        ...status,
                        viewersCount:
                            response.data
                                .viewersCount,
                        viewers:
                            status.viewers || []
                    }
                    : status
            )
        );

    } catch (error) {

        console.error(
            "MARK STATUS VIEW ERROR:",
            error
        );

    }
};

  useEffect(() => {
    fetchUsers();
  }, [search]);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {

    fetchMyStatuses();

}, []);

  useEffect(() => {

    const handleNewMessage = (message) => {

        const chatId =
            message.chat?._id ||
            message.chat;

        setChats((previousChats) => {

            return previousChats.map((chat) => {

                if (
                    chat._id.toString() !==
                    chatId.toString()
                ) {
                    return chat;
                }

                return {
                    ...chat,
                    latestMessage: message,
                    updatedAt: message.createdAt,
                };

            });

        });

    };

    socket.on(
        "newMessage",
        handleNewMessage
    );

    return () => {

        socket.off(
            "newMessage",
            handleNewMessage
        );

    };

}, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setSelectedChat(null);
    navigate("/login", { replace: true });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      
      <header className="
    px-4
    pt-4
    pb-3
    border-b
    border-white/10
    bg-slate-900
">

    {/* =========================
        TOP HEADER
    ========================= */}

    <div className="
        flex
        items-center
        justify-between
    ">

        {/* BRAND */}

        <div className="
            flex
            items-center
            gap-3
            min-w-0
        ">

            {/* AVATAR */}

            <div className="
                relative
                h-10
                w-10
                shrink-0
                rounded-xl
                overflow-hidden
                bg-gradient-to-br
                from-indigo-500
                to-violet-600
                grid
                place-items-center
                font-bold
                text-white
                shadow-lg
                shadow-indigo-900/20
            ">

                {user?.avatar ? (

                    <img
                        src={user.avatar}
                        alt={user?.name || "User"}
                        className="
                            w-full
                            h-full
                            object-cover
                        "
                    />

                ) : (

                    user?.name
                        ?.charAt(0)
                        ?.toUpperCase() || "U"

                )}

            </div>


            {/* ONLINE DOT */}

            <span className="
                absolute
                ml-7
                mt-7
                h-3
                w-3
                rounded-full
                bg-emerald-400
                border-2
                border-slate-900
            " />


            {/* BRAND TEXT */}

            <div className="
                min-w-0
            ">

                <div className="
                    flex
                    items-center
                    gap-2
                ">

                    <h2 className="
                        text-[17px]
                        font-black
                        tracking-tight
                        text-white
                    ">
                        ChatVerse
                    </h2>

                    <span className="
                        px-1.5
                        py-0.5
                        rounded-md
                        bg-indigo-500/10
                        border
                        border-indigo-500/20
                        text-[9px]
                        font-bold
                        tracking-wide
                        text-indigo-300
                    ">
                        CHAT
                    </span>

                </div>


                <p className="
                    mt-0.5
                    text-[11px]
                    text-slate-500
                    truncate
                    max-w-[150px]
                ">
                    {user?.name || "Welcome back"}
                </p>

            </div>

        </div>


        {/* NEW CHAT */}

        <div className="
            relative
            shrink-0
        ">

            <button
                type="button"
                onClick={() =>
                    setShowNewChatMenu(
                        prev => !prev
                    )
                }
                className="
                    h-10
                    w-10
                    rounded-xl
                    bg-white/5
                    border
                    border-white/10
                    text-slate-300
                    hover:bg-indigo-500
                    hover:border-indigo-500
                    hover:text-white
                    flex
                    items-center
                    justify-center
                    transition-all
                    duration-200
                    active:scale-95
                "
                title="New chat"
            >

                <span className="
                    text-xl
                    font-light
                    leading-none
                ">
                    +
                </span>

            </button>


            {/* NEW CHAT MENU */}

            {showNewChatMenu && (

                <div className="
                    absolute
                    right-0
                    top-12
                    z-[100]
                    w-52
                    rounded-2xl
                    bg-slate-800
                    border
                    border-white/10
                    shadow-2xl
                    overflow-hidden
                ">

                    <button
                        type="button"
                        onClick={() => {

                            setShowNewChatMenu(false);

                            // existing new contact logic

                        }}
                        className="
                            w-full
                            px-4
                            py-3
                            flex
                            items-center
                            gap-3
                            hover:bg-white/10
                            text-left
                            text-white
                            transition
                        "
                    >

                        <span className="text-lg">
                            👤
                        </span>

                        <div>

                            <p className="
                                text-sm
                                font-semibold
                            ">
                                New Contact
                            </p>

                            <p className="
                                text-xs
                                text-slate-500
                            ">
                                Start a conversation
                            </p>

                        </div>

                    </button>


                    <button
                        type="button"
                        onClick={() => {

                            setShowNewChatMenu(false);

                            setShowCreateGroup(true);

                        }}
                        className="
                            w-full
                            px-4
                            py-3
                            flex
                            items-center
                            gap-3
                            hover:bg-white/10
                            text-left
                            text-white
                            transition
                        "
                    >

                        <span className="text-lg">
                            👥
                        </span>

                        <div>

                            <p className="
                                text-sm
                                font-semibold
                            ">
                                New Group
                            </p>

                            <p className="
                                text-xs
                                text-slate-500
                            ">
                                Create a group chat
                            </p>

                        </div>

                    </button>

                </div>

            )}

        </div>

    </div>


    {/* =========================
        SEARCH
    ========================= */}

    <div className="
        mt-4
        flex
        items-center
        gap-2
        rounded-2xl
        bg-white/[0.04]
        border
        border-white/10
        px-3
        h-11
        focus-within:border-indigo-500/50
        focus-within:bg-white/[0.06]
        transition
    ">

        <Search
            size={17}
            className="
                text-slate-500
                shrink-0
            "
        />

        <input
            value={search}
            onChange={(e) =>
                setSearch(e.target.value)
            }
            placeholder="Search people..."
            className="
                flex-1
                min-w-0
                bg-transparent
                outline-none
                text-sm
                text-white
                placeholder:text-slate-500
            "
        />


        {search && (

            <button
                type="button"
                onClick={() =>
                    setSearch("")
                }
                className="
                    h-6
                    w-6
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    text-slate-500
                    hover:bg-white/10
                    hover:text-white
                    transition
                "
            >
                ×
            </button>

        )}

    </div>


 {/* =========================
    MY STATUS
========================= */}

<button
    type="button"
    onClick={async () => {

        await fetchMyStatuses();

        if (myStatuses.length > 0) {
            setActiveStatusIndex(0);
            setShowStatusViewer(true);
        } else {
            setShowStatus(true);
        }

    }}
    className="
        w-full
        mt-3
        flex
        items-center
        gap-3
        px-2
        py-2
        rounded-2xl
        hover:bg-white/[0.04]
        transition
        text-left
        group
    "
>

    {/* STATUS PREVIEW */}

    <div className="
        relative
        h-12
        w-12
        shrink-0
        rounded-full
        p-[2px]
        bg-gradient-to-tr
        from-emerald-400
        via-indigo-500
        to-violet-500
    ">

        <div className="
            h-full
            w-full
            rounded-full
            overflow-hidden
            bg-slate-900
            flex
            items-center
            justify-center
        ">

            {myStatuses.length > 0 &&
            myStatuses[myStatuses.length - 1]?.type === "image" ? (

                <img
                    src={
                        myStatuses[
                            myStatuses.length - 1
                        ].mediaUrl
                    }
                    alt="Latest status"
                    className="
                        w-full
                        h-full
                        object-cover
                    "
                />

            ) : myStatuses.length > 0 ? (

                <span className="
                    w-full
                    h-full
                    flex
                    items-center
                    justify-center
                    px-2
                    text-[9px]
                    text-center
                    font-bold
                    text-white
                    bg-gradient-to-br
                    from-indigo-600
                    via-violet-600
                    to-fuchsia-600
                    line-clamp-3
                ">
                    {
                        myStatuses[
                            myStatuses.length - 1
                        ]?.content
                    }
                </span>

            ) : user?.avatar ? (

                <img
                    src={user.avatar}
                    alt={user.name}
                    className="
                        w-full
                        h-full
                        object-cover
                    "
                />

            ) : (

                user?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"

            )}

        </div>


        {/* PLUS WHEN NO STATUS */}

        {myStatuses.length === 0 && (
            <span className="
                absolute
                right-0
                bottom-0
                h-5
                w-5
                rounded-full
                bg-indigo-600
                border-2
                border-slate-900
                flex
                items-center
                justify-center
                text-white
                text-sm
                font-bold
            ">
                +
            </span>
        )}

    </div>


    {/* STATUS INFO */}

    <div className="
        min-w-0
        flex-1
    ">

        <div className="
            flex
            items-center
            justify-between
        ">

            <p className="
                text-sm
                font-semibold
                text-white
                group-hover:text-indigo-300
                transition
            ">
                My Status
            </p>

            {myStatuses.length > 0 && (
                <span className="
                    text-[10px]
                    px-2
                    py-0.5
                    rounded-full
                    bg-indigo-500/10
                    text-indigo-300
                ">
                    {myStatuses.length}
                </span>
            )}

        </div>

        <p className="
            text-xs
            text-slate-500
            mt-0.5
            truncate
        ">
            {myStatuses.length > 0
                ? `${myStatuses.length} status${
                    myStatuses.length > 1
                        ? "es"
                        : ""
                  } • Tap to view`
                : "Add a status update"
            }
        </p>

    </div>

</button>
 

</header>

      {/* ARCHIVED BUTTON */}
{!showArchived && archivedChats.length > 0 && (
    <button
        type="button"
        onClick={() => setShowArchived(true)}
        className="
            mx-3
            mt-1
            mb-1
            w-[calc(100%-24px)]
            flex
            items-center
            gap-3
            px-3
            py-2.5
            rounded-xl
            text-sm
            text-slate-400
            hover:bg-white/5
            hover:text-white
            transition
        "
    >
        <Archive size={18} />

        <span className="flex-1 text-left">
            Archived
        </span>

        <span className="
            min-w-[26px]
            h-6
            px-2
            rounded-full
            bg-indigo-500/20
            text-indigo-300
            text-xs
            font-semibold
            grid
            place-items-center
        ">
            {archivedChats.length}
        </span>
    </button>
)}

{/* SEPARATOR */}
{!showArchived && (
    <div className="mx-3 border-b border-white/10" />
)}

{/* RECENT CHATS TITLE */}
{!showArchived && (
    <div className="
        px-4
        pt-3
        pb-2
        text-[11px]
        font-bold
        uppercase
        tracking-widest
        text-slate-500
    ">
        Recent Chats
    </div>
)}

{/* ARCHIVED HEADER */}
{showArchived && (
    <div className="
        px-4
        py-3
        border-b
        border-white/10
        flex
        items-center
        gap-3
    ">
        <button
            type="button"
            onClick={() => setShowArchived(false)}
            className="
                h-9
                w-9
                rounded-xl
                grid
                place-items-center
                hover:bg-white/10
                text-slate-300
                transition
            "
        >
            <ArrowLeft size={19} />
        </button>

        <div>
            <h3 className="
                text-sm
                font-semibold
                text-white
            ">
                Archived Chats
            </h3>

            <p className="
                text-xs
                text-slate-500
            ">
                {archivedChats.length} archived
            </p>
        </div>
    </div>
)}


{/* CHAT LIST */}

      <div className="flex-1 overflow-y-auto">
        {search.trim() ? (
          searchLoading ? (

        <div className="px-5 py-10 text-center text-sm text-slate-500">
            Searching...
        </div>

    ) : searchError ? (

        <div className="px-5 py-10 text-center">
            <p className="text-sm text-red-400">
                {searchError}
            </p>

            <button
                onClick={fetchUsers}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
            >
                Try again
            </button>
        </div>

    ) : users.length ? (

        users.map((person) => {

            const personId =
                person._id?.toString();

            const isOnline =
                onlineUsers.some(
                    (id) =>
                        id?.toString() === personId
                );

            return (
                <ChatCard
                    key={person._id}
                    name={person.name}
                    avatar={person.avatar}
                    lastMessage={
                        isOnline
                            ? "Online now"
                            : "Offline"
                    }
                    online={isOnline}
                    onClick={() =>
                        accessChat(person._id)
                    }
                    dark
                />
            );

        })

    ) : (

        <div className="px-5 py-10 text-center text-sm text-slate-500">
            No people found
        </div>

    )

)
            : (showArchived
        ? archivedChats
        : normalChats
    ).length ? (
          (showArchived
    ? archivedChats
    : normalChats
).map((chat) => {
            const isGroup = chat.isGroupChat === true;

const person = !isGroup
    ? chat.participants?.find(
        (p) =>
            p._id?.toString() !==
            user?._id?.toString()
    )
    : null;

return (
    <ChatCard
        key={chat._id}
        chatId={chat._id}

        name={
            isGroup
                ? chat.chatName || "Group"
                : person?.name || "Chat"
        }

        avatar={
            isGroup
                ? chat.groupAvatar || ""
                : person?.avatar || ""
        }
    lastMessage={
        chat.latestMessage?.content ||
        "Start a conversation"
    }
    online={
        !isGroup && person
            ? onlineUsers.some(
                id =>
                    id?.toString() ===
                    person._id?.toString()
            )
            : false
    }
    unreadCount={
        chat.unreadCounts?.[user?._id] || 0
    }
    active={selectedChat?._id === chat._id}
    onClick={() => setSelectedChat(chat)}
    onRefresh={fetchChats}
    dark
    pinned={
    chat.pinnedBy?.some(
        id =>
            id?.toString() ===
            user?._id?.toString()
    ) || false
}

muted={
    chat.mutedBy?.some(
        id =>
            id?.toString() ===
            user?._id?.toString()
    ) || false
}
archived={
                    chat.archivedBy?.some(
                        id =>
                            id?.toString() ===
                            user?._id?.toString()
                    ) || false
                }
/>
            );
          })
        ) : (
          <div className="px-5 py-12 text-center">
            <UserRound className="mx-auto text-slate-600" size={28} />
            <p className="mt-3 text-sm text-slate-500">Search someone to start chatting.</p>
          </div>
        )}
        
      </div>
      {/* Profile / Settings / Logout */}
      <div className="border-t border-white/10 p-3 bg-slate-900">

        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition group"
        >
          <div className="
    h-10
    w-10
    rounded-xl
    overflow-hidden
    shrink-0
    bg-gradient-to-br
    from-indigo-500
    to-violet-600
    grid
    place-items-center
    font-bold
    text-white
">
    {user?.avatar ? (
        <img
            src={user.avatar}
            alt={user?.name || "User"}
            className="w-full h-full object-cover"
        />
    ) : (
        user?.name?.charAt(0)?.toUpperCase() || "U"
    )}
</div>

          <div className="text-left min-w-0">
            <p className="font-semibold text-sm truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              View profile
            </p>
          </div>

          <User
            size={17}
            className="ml-auto text-slate-600 group-hover:text-slate-300 transition"
          /> Profile
        </button>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition text-sm"
          >
            <Settings size={16} />
            Settings
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

      </div>
         {showCreateGroup && (
    <CreateGroup
    user={user}
        onClose={() =>
            setShowCreateGroup(false)
        }

        onCreated={async (group) => {

            setShowCreateGroup(false);

            await fetchChats();

            setSelectedChat(group);

        }}
    />
)}

    {/* =========================
    STATUS OPTIONS MODAL
========================= */}

{showStatus && (

    <div className="
        fixed
        inset-0
        z-[1000]
        bg-black/60
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-4
    ">

        <div className="
            w-full
            max-w-md
            rounded-3xl
            bg-slate-900
            border
            border-white/10
            shadow-2xl
            overflow-hidden
        ">

            {/* HEADER */}

            <div className="
                flex
                items-center
                justify-between
                px-5
                py-4
                border-b
                border-white/10
            ">

                <div>

                    <h2 className="
                        text-lg
                        font-bold
                        text-white
                    ">
                        My Status
                    </h2>

                    <p className="
                        text-xs
                        text-slate-500
                        mt-1
                    ">
                        Share an update
                    </p>

                </div>


                <button
                    type="button"
                    onClick={() =>
                        setShowStatus(false)
                    }
                    className="
                        h-9
                        w-9
                        rounded-xl
                        text-slate-400
                        hover:bg-white/10
                        hover:text-white
                        text-xl
                    "
                >
                    ×
                </button>

            </div>


            {/* OPTIONS */}

            <div className="p-4 space-y-3">

                {/* TEXT */}

                <button
                    type="button"
                    onClick={() => {

                        setStatusType("text");

                        setShowStatus(false);

                        setShowCreateStatus(true);

                    }}
                    className="
                        w-full
                        flex
                        items-center
                        gap-4
                        p-4
                        rounded-2xl
                        bg-white/5
                        hover:bg-indigo-500/10
                        border
                        border-white/5
                        hover:border-indigo-500/30
                        transition
                        text-left
                    "
                >

                    <div className="
                        h-12
                        w-12
                        rounded-2xl
                        bg-indigo-500/15
                        text-indigo-400
                        flex
                        items-center
                        justify-center
                        text-xl
                    ">
                        ✍️
                    </div>

                    <div>

                        <p className="
                            text-sm
                            font-semibold
                            text-white
                        ">
                            Text Status
                        </p>

                        <p className="
                            text-xs
                            text-slate-500
                            mt-1
                        ">
                            Share something with your contacts
                        </p>

                    </div>

                </button>


                {/* IMAGE */}

                <label
                    className="
                        w-full
                        flex
                        items-center
                        gap-4
                        p-4
                        rounded-2xl
                        bg-white/5
                        hover:bg-emerald-500/10
                        border
                        border-white/5
                        hover:border-emerald-500/30
                        transition
                        text-left
                        cursor-pointer
                    "
                >

                    <div className="
                        h-12
                        w-12
                        rounded-2xl
                        bg-emerald-500/15
                        text-emerald-400
                        flex
                        items-center
                        justify-center
                        text-xl
                    ">
                        🖼️
                    </div>

                    <div>

                        <p className="
                            text-sm
                            font-semibold
                            text-white
                        ">
                            Photo Status
                        </p>

                        <p className="
                            text-xs
                            text-slate-500
                            mt-1
                        ">
                            Share an image
                        </p>

                    </div>


                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {

                            handleStatusImageSelect(
                                event
                            );

                            setShowStatus(false);

                            setShowCreateStatus(
                                true
                            );

                        }}
                    />

                </label>

            </div>

        </div>

    </div>

)}

{/* =========================
    CREATE STATUS MODAL
========================= */}

{showCreateStatus && (

    <div className="
        fixed
        inset-0
        z-[1100]
        bg-black/70
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-4
    ">

        <div className="
            w-full
            max-w-md
            rounded-3xl
            bg-slate-900
            border
            border-white/10
            shadow-2xl
            overflow-hidden
        ">


            {/* HEADER */}

            <div className="
                flex
                items-center
                justify-between
                px-5
                py-4
                border-b
                border-white/10
            ">

                <div>

                    <h2 className="
                        text-lg
                        font-bold
                        text-white
                    ">
                        {statusType === "image"
                            ? "Photo Status"
                            : "Text Status"}
                    </h2>

                    <p className="
                        text-xs
                        text-slate-500
                        mt-1
                    ">
                        This status disappears after 24 hours
                    </p>

                </div>


                <button
                    type="button"
                    onClick={() => {

                        setShowCreateStatus(false);

                        setStatusContent("");

                        setStatusImage(null);

                        setStatusImagePreview("");

                    }}
                    className="
                        h-9
                        w-9
                        rounded-xl
                        text-slate-400
                        hover:bg-white/10
                        hover:text-white
                        text-xl
                    "
                >
                    ×
                </button>

            </div>


            {/* PREVIEW */}

            <div className="p-5">


                {statusType === "image" ? (

                    <div className="
                        relative
                        w-full
                        h-[360px]
                        rounded-2xl
                        overflow-hidden
                        bg-black
                    ">

                        {statusImagePreview ? (

                            <img
                                src={
                                    statusImagePreview
                                }
                                alt="Status preview"
                                className="
                                    w-full
                                    h-full
                                    object-cover
                                "
                            />

                        ) : (

                            <div className="
                                h-full
                                flex
                                items-center
                                justify-center
                                text-slate-500
                            ">
                                Select an image
                            </div>

                        )}

                    </div>

                ) : (

                    <div className="
                        min-h-[260px]
                        rounded-2xl
                        bg-gradient-to-br
                        from-indigo-600
                        via-violet-600
                        to-fuchsia-600
                        flex
                        items-center
                        justify-center
                        p-8
                    ">

                        <textarea
                            value={
                                statusContent
                            }
                            onChange={(e) =>
                                setStatusContent(
                                    e.target.value
                                )
                            }
                            maxLength={500}
                            rows={5}
                            autoFocus
                            placeholder="
                                What's on your mind?
                            "
                            className="
                                w-full
                                bg-transparent
                                text-white
                                text-xl
                                md:text-2xl
                                font-semibold
                                text-center
                                placeholder:text-white/50
                                resize-none
                                outline-none
                            "
                        />

                    </div>

                )}


                {/* IMAGE CAPTION */}

                {statusType === "image" && (

                    <textarea
                        value={
                            statusContent
                        }
                        onChange={(e) =>
                            setStatusContent(
                                e.target.value
                            )
                        }
                        maxLength={500}
                        rows={2}
                        placeholder="
                            Add a caption...
                        "
                        className="
                            w-full
                            mt-3
                            rounded-2xl
                            bg-white/5
                            border
                            border-white/10
                            px-4
                            py-3
                            text-sm
                            text-white
                            placeholder:text-slate-500
                            outline-none
                            focus:border-indigo-500
                            resize-none
                        "
                    />

                )}


                {/* POST */}

                <button
                    type="button"
                    onClick={
                        handlePostStatus
                    }
                    disabled={
                        postingStatus
                    }
                    className="
                        w-full
                        mt-4
                        py-3.5
                        rounded-2xl
                        bg-indigo-600
                        hover:bg-indigo-500
                        text-white
                        font-bold
                        transition
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                    "
                >

                    {postingStatus
                        ? "Posting..."
                        : "Post Status"}

                </button>

            </div>

        </div>

    </div>

)}

    {/* =========================
    STATUS VIEWER
========================= */}

{showStatusViewer &&
    myStatuses.length > 0 && (

    <div className="
        fixed
        inset-0
        z-[2000]
        bg-black
        flex
        items-center
        justify-center
    ">

        {/* VIEWER */}

        <div className="
            relative
            w-full
            h-full
            max-w-[520px]
            bg-slate-950
            overflow-hidden
        ">


            {/* TOP PROGRESS */}

            <div className="
                absolute
                top-3
                left-3
                right-3
                z-20
                flex
                gap-1
            ">

                {myStatuses.map(
                    (status, index) => (

                    <div
                        key={status._id}
                        className="
                            h-1
                            flex-1
                            rounded-full
                            bg-white/30
                            overflow-hidden
                        "
                    >

                        <div
                            className={`
                                h-full
                                rounded-full
                                ${
                                    index <=
                                    activeStatusIndex
                                        ? "bg-white"
                                        : "bg-transparent"
                                }
                            `}
                        />

                    </div>

                ))}

            </div>


            {/* HEADER */}

            <div className="
                absolute
                top-7
                left-4
                right-4
                z-20
                flex
                items-center
                justify-between
            ">

                <div className="
                    flex
                    items-center
                    gap-3
                ">

                    <div className="
                        h-10
                        w-10
                        rounded-full
                        overflow-hidden
                        bg-gradient-to-br
                        from-indigo-500
                        to-violet-600
                        flex
                        items-center
                        justify-center
                        text-white
                        font-bold
                    ">

                        {user?.avatar ? (

                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="
                                    w-full
                                    h-full
                                    object-cover
                                "
                            />

                        ) : (

                            user?.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                            "U"

                        )}

                    </div>


                    <div>

                        <p className="
                            text-sm
                            font-semibold
                            text-white
                        ">
                            {user?.name || "You"}
                        </p>

                        <p className="
                            text-xs
                            text-white/60
                        ">
                            {new Date(
                                myStatuses[
                                    activeStatusIndex
                                ]?.createdAt
                            ).toLocaleTimeString(
                                [],
                                {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            )}
                        </p>

                        <p className="
    text-[11px]
    text-white/50
    mt-0.5
">
    👁 {
        myStatuses[
            activeStatusIndex
        ]?.viewers?.length || 0
    } views
</p>

                    </div>

                </div>


                <button
                    type="button"
                    onClick={() =>
                        setShowStatusViewer(false)
                    }
                    className="
                        h-10
                        w-10
                        rounded-full
                        bg-black/30
                        text-white
                        text-2xl
                        hover:bg-black/50
                        transition
                    "
                >
                    ×
                </button>

              <button
    type="button"
    disabled={deletingStatus}
    onClick={async () => {

        const status =
            myStatuses[
                activeStatusIndex
            ];

        if (!status?._id) {
            return;
        }

        const confirmed =
            window.confirm(
                "Delete this status?"
            );

        if (!confirmed) {
            return;
        }

        try {

            setDeletingStatus(true);

            await api.delete(
                `/status/${status._id}`
            );

            const remaining =
                myStatuses.filter(
                    item =>
                        item._id !==
                        status._id
                );

            setMyStatuses(remaining);

            if (remaining.length === 0) {

                setShowStatusViewer(false);

                return;
            }

            setActiveStatusIndex(
                prev =>
                    Math.min(
                        prev,
                        remaining.length - 1
                    )
            );

        } catch (error) {

            console.error(
                "DELETE STATUS ERROR:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to delete status"
            );

        } finally {

            setDeletingStatus(false);

        }

    }}
    className="
        h-10
        px-3
        rounded-xl
        bg-red-500/10
        text-red-400
        hover:bg-red-500/20
        transition
        text-sm
        font-semibold
    "
>
    {deletingStatus
        ? "Deleting..."
        : "Delete"}
</button>

            </div>


            {/* STATUS CONTENT */}

            {myStatuses[
                activeStatusIndex
            ]?.type === "image" ? (

                <div className="
                    w-full
                    h-full
                    flex
                    items-center
                    justify-center
                    bg-black
                ">

                    <img
                        src={
                            myStatuses[
                                activeStatusIndex
                            ]?.mediaUrl
                        }
                        alt="Status"
                        className="
                            max-w-full
                            max-h-full
                            object-contain
                        "
                    />

                </div>

            ) : (

                <div className="
                    w-full
                    h-full
                    flex
                    items-center
                    justify-center
                    px-10
                    bg-gradient-to-br
                    from-indigo-600
                    via-violet-600
                    to-fuchsia-600
                ">

                    <p className="
                        text-white
                        text-2xl
                        md:text-3xl
                        font-bold
                        text-center
                        break-words
                    ">
                        {
                            myStatuses[
                                activeStatusIndex
                            ]?.content
                        }
                    </p>

                </div>

            )}


            {/* CAPTION */}

            {myStatuses[
                activeStatusIndex
            ]?.type === "image" &&
                myStatuses[
                    activeStatusIndex
                ]?.content && (

                <div className="
                    absolute
                    bottom-8
                    left-5
                    right-5
                    z-20
                    text-center
                ">

                    <p className="
                        inline-block
                        px-4
                        py-2
                        rounded-xl
                        bg-black/50
                        backdrop-blur
                        text-white
                        text-sm
                    ">
                        {
                            myStatuses[
                                activeStatusIndex
                            ]?.content
                        }
                    </p>

                </div>

            )}


            {/* PREVIOUS */}

            {activeStatusIndex > 0 && (

                <button
                    type="button"
                    onClick={() =>
                        setActiveStatusIndex(
                            prev => prev - 1
                        )
                    }
                    className="
                        absolute
                        left-0
                        top-1/2
                        -translate-y-1/2
                        z-30
                        h-20
                        w-14
                        flex
                        items-center
                        justify-center
                        text-white
                        text-3xl
                        bg-gradient-to-r
                        from-black/40
                        to-transparent
                    "
                >
                    ‹
                </button>

            )}


            {/* NEXT */}

            {activeStatusIndex <
                myStatuses.length - 1 && (

                <button
                    type="button"
                    onClick={() =>
                        setActiveStatusIndex(
                            prev => prev + 1
                        )
                    }
                    className="
                        absolute
                        right-0
                        top-1/2
                        -translate-y-1/2
                        z-30
                        h-20
                        w-14
                        flex
                        items-center
                        justify-center
                        text-white
                        text-3xl
                        bg-gradient-to-l
                        from-black/40
                        to-transparent
                    "
                >
                    ›
                </button>

            )}

        </div>

    </div>

)}

    </div>
  );
}

export default Sidebar;