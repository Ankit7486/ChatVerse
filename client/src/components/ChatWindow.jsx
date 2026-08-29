import { useEffect, useMemo, useRef, useState } from "react";
import { Phone, Video, MoreVertical, Search, Reply, Copy, Pencil, Trash2, Download, ExternalLink, ArrowLeft, Bell, BellOff, Archive, X, Forward, Pin, Users, Camera, LogOut, Save } from "lucide-react";
import api from "../services/api";
import MessageInput from "./MessageInput";
import PollCard from "./PollCard";
import socket from "../services/socket";

function ChatWindow({ selectedChat, setSelectedChat, currentUser, onlineUsers, onBack, chats }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [activeMessage, setActiveMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const reactionEmojis = ["❤️","😂","👍","🔥","😢","😮"];
  const [previewImage, setPreviewImage] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const [autoDownload, setAutoDownload] = useState(true);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
const [isMuted, setIsMuted] = useState(false);
const [isCameraOff, setIsCameraOff] = useState(false);
const [isScreenSharing, setIsScreenSharing] =
    useState(false);
  const [showAnnouncement, setShowAnnouncement] =
    useState(false);

const [announcementText, setAnnouncementText] =
    useState("");

const [savingAnnouncement, setSavingAnnouncement] =
    useState(false);
  const [editGroupName, setEditGroupName] =
    useState("");

const [groupDescription, setGroupDescription] =
    useState("");

const [groupAvatarPreview, setGroupAvatarPreview] =
    useState("");

    const [groupAvatarFile, setGroupAvatarFile] =
    useState(null);

const [savingGroup, setSavingGroup] =
    useState(false);

const [memberSearch, setMemberSearch] = useState("");

const [availableUsers, setAvailableUsers] = useState([]);

const [selectedMembers, setSelectedMembers] = useState([]);

const [addingMembers, setAddingMembers] = useState(false);
  const [polls, setPolls] = useState([]);
  const [forwardMessage, setForwardMessage] =
    useState(null);

const [forwardSearch, setForwardSearch] =
    useState("");

const [selectedForwardChats, setSelectedForwardChats] =
    useState([]);
  const [callState, setCallState] =
    useState("idle");

const [callType, setCallType] =
    useState(null);

const [incomingCall, setIncomingCall] =
    useState(null);

const [remoteStream, setRemoteStream] =
    useState(null);

const localVideoRef =
    useRef(null);

const remoteVideoRef =
    useRef(null);

    const remoteAudioRef =
    useRef(null);

const peerConnectionRef =
    useRef(null);

const localStreamRef =
    useRef(null);
    const screenStreamRef = useRef(null);
    const cameraTrackRef = useRef(null);

    const callPeerIdRef = useRef(null);

    const pendingIceCandidatesRef =
    useRef([]);
const callTimeoutRef = useRef(null);
const isEndingCallRef =
    useRef(false);
  const messageRefs = useRef({});
  const callTimerRef = useRef(null);
  const remoteDescriptionSetRef = useRef(false);
  const bottomRef = useRef(null);

  const otherUser = useMemo(() => {
    if (!selectedChat?.participants || !currentUser?._id) return null;
    return selectedChat.participants.find(
      (person) => person._id?.toString() !== currentUser._id?.toString()
    );
  }, [selectedChat, currentUser]);

  const isGroupChat =
    selectedChat?.isGroupChat === true;

    const groupAdminId =
    selectedChat?.groupAdmin?._id?.toString() ||
    selectedChat?.groupAdmin?.toString();

const currentUserId =
    currentUser?._id?.toString();

const isGroupAdmin =
    isGroupChat &&
    groupAdminId === currentUserId;

    const isRestrictedGroup =
    isGroupChat &&
    selectedChat?.onlyAdminsCanSend === true;

const canSendMessage =
    !isRestrictedGroup ||
    isGroupAdmin;

const chatDisplayName = isGroupChat
    ? selectedChat?.chatName || "Group"
    : otherUser?.name || "Conversation";

const chatDisplayAvatar = isGroupChat
    ? selectedChat?.groupAvatar || ""
    : otherUser?.avatar || "";

     const isChatMuted =
    selectedChat?.mutedBy?.some(
        (id) =>
            id?.toString() ===
            currentUser?._id?.toString()
    ) || false;

  const isOnline =
    !!otherUser &&
    Array.isArray(onlineUsers) &&
    onlineUsers.some((item) => {

        const id =
            typeof item === "object"
                ? item?._id || item?.userId || item?.id
                : item;

        return (
            id?.toString() ===
            otherUser?._id?.toString()
        );
    });

  const addMessageOnce = (message) => {
    if (!message?._id) return;
    setMessages((prev) =>
      prev.some((item) => item._id === message._id)
        ? prev
        : [...prev, message]
    );
  };

   const pinnedMessage = messages.find(
    (message) => message.pinned && !message.deleted
);

const scrollToPinnedMessage = () => {

    if (!pinnedMessage?._id) {
        return;
    }

    const element =
        messageRefs.current[pinnedMessage._id];

    if (!element) {
        return;
    }

    element.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    // temporary highlight
    element.classList.add(
        "ring-2",
        "ring-indigo-400",
        "rounded-2xl"
    );

    setTimeout(() => {
        element.classList.remove(
            "ring-2",
            "ring-indigo-400",
            "rounded-2xl"
        );
    }, 1500);
};

  const searchUsersForGroup = async (keyword) => {
    try {
        const response = await api.get(
            `/users?search=${encodeURIComponent(keyword)}`
        );

        const users = Array.isArray(response.data)
            ? response.data
            : response.data?.users || [];

        const existingMemberIds =
            selectedChat?.participants?.map(
                member => member._id?.toString()
            ) || [];

        const filtered = users.filter(
            user =>
                !existingMemberIds.includes(
                    user._id?.toString()
                )
        );

        setAvailableUsers(filtered);

    } catch (error) {
        console.error(
            "Search group members error:",
            error
        );

        setAvailableUsers([]);
    }
};

  const fetchMessages = async () => {
    if (!selectedChat?._id) return;
    try {
      setLoading(true);
      const response = await api.get(`/message/${selectedChat._id}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolls = async () => {
    if (!selectedChat?._id) return;

    try {
        const response = await api.get(
            `/poll/${selectedChat._id}`
        );

        setPolls(response.data);

    } catch (error) {
        console.error(
            "Error fetching polls:",
            error
        );
    }
};

  const markAsRead = async () => {

    if (!selectedChat?._id) return;

    try {

        await api.patch(
            `/message/read/${selectedChat._id}`
        );

    } catch (error) {

        console.error(
            "Mark read error:",
            error
        );

    }
};

    const handleEditMessage = async () => {

    if (!editingMessage || !editText.trim()) {
        return;
    }

    try {

        const response = await api.patch(
            `/message/${editingMessage._id}`,
            {
                content: editText.trim()
            }
        );

        setMessages((previous) =>
            previous.map((message) =>
                message._id ===
                editingMessage._id
                    ? response.data
                    : message
            )
        );

        socket.emit(
            "messageEdited",
            response.data
        );

        setEditingMessage(null);
        setEditText("");

    } catch (error) {

        console.error(
            "Edit message error:",
            error
        );

    }
};
  const handleDeleteMessage = async (messageId) => {

    const confirmed = window.confirm(
        "Delete this message?"
    );

    if (!confirmed) return;

    try {

        const response = await api.delete(
            `/message/${messageId}`
        );

        setMessages((previous) =>
            previous.map((message) =>
                message._id === messageId
                    ? response.data
                    : message
            )
        );

        socket.emit(
            "messageDeleted",
            response.data
        );

    } catch (error) {

        console.error(
            "Delete message error:",
            error
        );

    }
};

  const handleCopyMessage = async (content) => {
    try {
        await navigator.clipboard.writeText(content);

        setActiveMessage(null);

    } catch (error) {
        console.error("Copy failed:", error);
    }
};

  const formatLastSeen = (date) => {

    if (!date) {
        return "Offline";
    }

    const lastSeen = new Date(date);
    const now = new Date();

    const diff =
        Math.floor(
            (now - lastSeen) / 1000
        );

    if (diff < 60) {
        return "Last seen just now";
    }

    const minutes =
        Math.floor(diff / 60);

    if (minutes < 60) {
        return `Last seen ${minutes}m ago`;
    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {
        return `Last seen ${hours}h ago`;
    }

    const days =
        Math.floor(hours / 24);

    if (days === 1) {
        return "Last seen yesterday";
    }

    return `Last seen ${days}d ago`;
};

      const handleReaction = async (
    messageId,
    emoji
) => {

    try {

        const response = await api.post(
            `/message/${messageId}/reaction`,
            { emoji }
        );

        setMessages((previous) =>
            previous.map((message) =>
                message._id === messageId
                    ? response.data
                    : message
            )
        );

    } catch (error) {

        console.error(
            "Reaction error:",
            error
        );

    }
};

     const handleReactionUpdated = (
    updatedMessage
) => {

    setMessages((previous) =>
        previous.map((message) =>
            message._id === updatedMessage._id
                ? updatedMessage
                : message
        )
    );

};

  const toggleGroupMember = (userId) => {

    setSelectedMembers(previous => {

        if (previous.includes(userId)) {

            return previous.filter(
                id => id !== userId
            );

        }

        return [
            ...previous,
            userId
        ];

    });

};

const handleAddMembers = async () => {

    if (!selectedChat?._id) {
        return;
    }

    if (selectedMembers.length === 0) {
        return;
    }

    try {

        setAddingMembers(true);

        const response = await api.patch(
            `/chat/${selectedChat._id}/members`,
            {
                memberIds: selectedMembers
            }
        );

        const updatedGroup = response.data;

        /*
         * Update currently opened chat
         */
        setSelectedChat(updatedGroup);

        /*
         * If your ChatWindow receives messages
         * through props, keep your existing message
         * state untouched.
         */

        setSelectedMembers([]);
        setMemberSearch("");
        setAvailableUsers([]);
        setShowAddMembers(false);

    } catch (error) {

        console.error(
            "Add members error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Unable to add members"
        );

    } finally {

        setAddingMembers(false);

    }
};

  const handleRemoveMember = async (memberId, memberName) => {

    if (!selectedChat?._id) {
        return;
    }

    const confirmed = window.confirm(
        `Remove ${memberName || "this member"} from the group?`
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await api.delete(
            `/chat/${selectedChat._id}/members/${memberId}`
        );

        const updatedGroup = response.data;

        setSelectedChat(updatedGroup);

        window.dispatchEvent(
            new Event("chatverse-chats-refresh")
        );

    } catch (error) {

        console.error(
            "Remove member error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to remove member"
        );
    }
};

const handleTransferAdmin = async (
    memberId,
    memberName
) => {

    if (!selectedChat?._id) {
        return;
    }

    const confirmed = window.confirm(
        `Make ${memberName} the new group admin?`
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await api.patch(
            `/chat/${selectedChat._id}/admin/${memberId}`
        );

        setSelectedChat(response.data);

        window.dispatchEvent(
            new Event("chatverse-chats-refresh")
        );

    } catch (error) {

        console.error(
            "Transfer admin error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to transfer admin"
        );
    }
};

const handleGroupSendPermission = async (
    onlyAdminsCanSend
) => {

    if (!selectedChat?._id || !isGroupAdmin) {
        return;
    }

    try {

        const response = await api.patch(
            `/chat/${selectedChat._id}/permissions`,
            {
                onlyAdminsCanSend
            }
        );

        setSelectedChat(response.data);

        window.dispatchEvent(
            new Event("chatverse-chats-refresh")
        );

    } catch (error) {

        console.error(
            "Group permission error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Unable to update group permissions"
        );
    }
};

 const handleEditGroup = async () => {

    if (!selectedChat?._id || !isGroupAdmin) {
        return;
    }

    if (!editGroupName.trim()) {
        alert("Group name cannot be empty");
        return;
    }

    try {

        setSavingGroup(true);

        let updatedGroup = selectedChat;

        // =========================
        // 1. UPLOAD NEW GROUP DP
        // =========================

        if (groupAvatarFile) {

            const formData = new FormData();

            formData.append(
                "groupAvatar",
                groupAvatarFile
            );

            const avatarResponse =
                await api.patch(
                    `/chat/${selectedChat._id}/group-avatar`,
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }
                );

            updatedGroup =
                avatarResponse.data;
        }

        // =========================
        // 2. SAVE NAME + DESCRIPTION
        // =========================

        const response = await api.patch(
            `/chat/${selectedChat._id}/group-info`,
            {
                chatName:
                    editGroupName.trim(),

                groupDescription:
                    groupDescription.trim(),

                // Keep current avatar URL
                groupAvatar:
                    updatedGroup?.groupAvatar ||
                    selectedChat?.groupAvatar ||
                    ""
            }
        );

        updatedGroup = response.data;

        // =========================
        // 3. UPDATE UI IMMEDIATELY
        // =========================

        setSelectedChat(updatedGroup);

        setGroupAvatarFile(null);

        setGroupAvatarPreview(
            updatedGroup?.groupAvatar || ""
        );

        setShowEditGroup(false);

        // Refresh sidebar
        window.dispatchEvent(
            new Event(
                "chatverse-chats-refresh"
            )
        );

    } catch (error) {

        console.error(
            "Edit group error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Unable to update group"
        );

    } finally {

        setSavingGroup(false);
    }
};

const handleCreateAnnouncement = async () => {

    if (!selectedChat?._id || !isGroupAdmin) {
        return;
    }

    if (!announcementText.trim()) {
        alert("Announcement cannot be empty");
        return;
    }

    try {

        setSavingAnnouncement(true);

        const response = await api.post(
            `/chat/${selectedChat._id}/announcement`,
            {
                content:
                    announcementText.trim()
            }
        );

        setSelectedChat(response.data);

        setAnnouncementText("");

        setShowAnnouncement(false);

        window.dispatchEvent(
            new Event(
                "chatverse-chats-refresh"
            )
        );

    } catch (error) {

        console.error(
            "Create announcement error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to create announcement"
        );

    } finally {

        setSavingAnnouncement(false);
    }
};

const handleDeleteAnnouncement = async () => {

    if (!selectedChat?._id || !isGroupAdmin) {
        return;
    }

    const confirmed =
        window.confirm(
            "Remove this announcement?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response = await api.delete(
            `/chat/${selectedChat._id}/announcement`
        );

        setSelectedChat(response.data);

    } catch (error) {

        console.error(
            "Delete announcement error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to remove announcement"
        );
    }
};

const handleExitGroup = async () => {

    if (!selectedChat?._id || !isGroupChat) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to exit "${chatDisplayName}"?`
    );

    if (!confirmed) {
        return;
    }

    try {

        await api.delete(
            `/chat/${selectedChat._id}/leave`
        );

        setShowChatInfo(false);

        setSelectedChat(null);

        window.dispatchEvent(
            new Event("chatverse-chats-refresh")
        );

    } catch (error) {

        console.error(
            "Exit group error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Unable to exit group"
        );
    }
};

  const handleGroupUpdated = (updatedGroup) => {

    if (
        updatedGroup?._id?.toString() !==
        selectedChat?._id?.toString()
    ) {
        return;
    }

    setSelectedChat(updatedGroup);
};

  const searchResults = searchQuery.trim()
    ? messages.filter(message =>
        !message.deleted &&
        message.content
            ?.toLowerCase()
            .includes(
                searchQuery
                    .trim()
                    .toLowerCase()
            )
    )
    : [];

    const highlightText = (text) => {

    if (!text || !searchQuery.trim()) {
        return text;
    }

    const escapedQuery =
        searchQuery.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

    const parts = text.split(
        new RegExp(
            `(${escapedQuery})`,
            "gi"
        )
    );

    return parts.map((part, index) => {

        const matched =
            part.toLowerCase() ===
            searchQuery.toLowerCase();

        return matched ? (
            <mark
                key={index}
                className="
                    rounded
                    bg-yellow-300
                    px-0.5
                    text-slate-900
                    font-semibold
                "
            >
                {part}
            </mark>
        ) : (
            <span key={index}>
                {part}
            </span>
        );
    });
};

    const renderMessageAttachment = (message, isMine) => {

    if (!message?.fileUrl) {
        return null;
    }

    // IMAGE
    if (message.messageType === "image") {

        return (
            <div className="mb-2">

                <img
                    src={message.fileUrl}
                    alt={message.fileName || "Image"}
                    className="
                        max-w-[280px]
                        max-h-[320px]
                        rounded-xl
                        object-cover
                        cursor-pointer
                        hover:opacity-95
                        transition
                    "
                    onClick={() =>
                         setPreviewImage({
        url: message.fileUrl,
        name: message.fileName || "image"
    })
                    }
                />

                {message.fileName && (
                    <p
                        className={`mt-1 text-[11px] truncate ${
                            isMine
                                ? "text-indigo-200"
                                : "text-slate-400"
                        }`}
                    >
                        {message.fileName}
                    </p>
                )}

            </div>
        );
    }
  
    // AUDIO
if (message.messageType === "audio") {
    return (
        <div className="mb-2">
            <audio
                src={message.fileUrl}
                controls
                preload="metadata"
                className="
                    w-[260px]
                    max-w-full
                "
            />

            {message.fileName && (
                <p
                    className={`
                        mt-1
                        text-[11px]
                        truncate
                        ${
                            isMine
                                ? "text-indigo-200"
                                : "text-slate-400"
                        }
                    `}
                >
                    🎙️ Voice message
                </p>
            )}
        </div>
    );
}

    // VIDEO
    if (message.messageType === "video") {

        return (
            <div className="mb-2">

                <video
                    src={message.fileUrl}
                    controls
                    preload="metadata"
                    className="
                        max-w-[300px]
                        max-h-[320px]
                        rounded-xl
                        bg-black
                    "
                />

                {message.fileName && (
                    <p
                        className={`mt-1 text-[11px] truncate ${
                            isMine
                                ? "text-indigo-200"
                                : "text-slate-400"
                        }`}
                    >
                        {message.fileName}
                    </p>
                )}

            </div>
        );
    }


    // DOCUMENT / OTHER FILE
    return (
        <div
            className={`
                mb-2
                flex
                items-center
                gap-3
                rounded-xl
                p-3
                min-w-[220px]
                ${
                    isMine
                        ? "bg-white/10"
                        : "bg-slate-100"
                }
            `}
        >

            <div className="
                h-10
                w-10
                shrink-0
                rounded-lg
                bg-indigo-100
                text-indigo-600
                grid
                place-items-center
                text-lg
            ">
                📄
            </div>


            <div className="min-w-0 flex-1">

                <p className="
                    text-sm
                    font-semibold
                    truncate
                ">
                    {message.fileName || "Document"}
                </p>

                <p className={`
                    text-[11px]
                    ${
                        isMine
                            ? "text-indigo-200"
                            : "text-slate-400"
                    }
                `}>
                    {message.fileSize
                        ? `${(
                            message.fileSize /
                            (1024 * 1024)
                        ).toFixed(2)} MB`
                        : "File"}
                </p>

            </div>


            <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
                    h-9
                    w-9
                    shrink-0
                    rounded-lg
                    grid
                    place-items-center
                    hover:bg-black/10
                "
                title="Open file"
            >
                <ExternalLink size={16} />
            </a>

            <a
                href={message.fileUrl}
                download={message.fileName}
                className="
                    h-9
                    w-9
                    shrink-0
                    rounded-lg
                    grid
                    place-items-center
                    hover:bg-black/10
                "
                title="Download"
            >
                <Download size={16} />
            </a>

        </div>
    );
};

  const rtcConfig = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        },
        {
            urls: "stun:stun1.l.google.com:19302"
        }
    ]
};

if (
    import.meta.env.VITE_TURN_URL &&
    import.meta.env.VITE_TURN_USERNAME &&
    import.meta.env.VITE_TURN_CREDENTIAL
) {
    rtcConfig.iceServers.push({
        urls: import.meta.env.VITE_TURN_URL,
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_CREDENTIAL
    });
}

const startCallTimer = () => {

    clearInterval(
        callTimerRef.current
    );

    setCallDuration(0);

    callTimerRef.current =
        setInterval(() => {

            setCallDuration(
                previous => previous + 1
            );

        }, 1000);
};


const stopCallTimer = () => {

    clearInterval(
        callTimerRef.current
    );

    callTimerRef.current = null;

    setCallDuration(0);
};


const formatCallDuration = (seconds) => {

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
};

const endCall = (notifyRemote = true) => {

    if (isEndingCallRef.current) {
        return;
    }

    isEndingCallRef.current =
        true;

    const peerId =
        callPeerIdRef.current;

    clearTimeout(
        callTimeoutRef.current
    );

    callTimeoutRef.current =
        null;

    clearInterval(
        callTimerRef.current
    );

    callTimerRef.current =
        null;

    if (
        notifyRemote &&
        peerId &&
        socket.connected
    ) {

        socket.emit(
            "call:end",
            {
                to: peerId
            }
        );
    }

    if (localStreamRef.current) {

        localStreamRef.current
            .getTracks()
            .forEach(
                (track) =>
                    track.stop()
            );

        localStreamRef.current =
            null;
    }

    if (
        peerConnectionRef.current
    ) {

        try {
            peerConnectionRef.current.close();
        } catch (error) {
            console.warn(error);
        }

        peerConnectionRef.current =
            null;
    }

    if (localVideoRef.current) {
        localVideoRef.current.srcObject =
            null;
    }

    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject =
            null;
    }

    if (remoteAudioRef.current) {
    remoteAudioRef.current.srcObject =
        null;
}

    pendingIceCandidatesRef.current =
        [];

    remoteDescriptionSetRef.current =
        false;

    callPeerIdRef.current =
        null;

    setRemoteStream(null);
    setIncomingCall(null);
    setCallType(null);
    setCallState("idle");
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);

    isEndingCallRef.current =
        false;
};

 const createPeerConnection = () => {

    const peer = new RTCPeerConnection(
        rtcConfig
    );

    peerConnectionRef.current = peer;

    // =========================
    // ICE CANDIDATES
    // =========================

    peer.onicecandidate = (event) => {

        if (
            event.candidate &&
            callPeerIdRef.current
        ) {

            socket.emit(
                "call:ice-candidate",
                {
                    to: callPeerIdRef.current,
                    candidate: event.candidate
                }
            );
        }
    };


    // =========================
    // REMOTE MEDIA
    // =========================

    peer.ontrack = (event) => {

    console.log(
        "🎧 Remote track received:",
        event.track.kind
    );

    const stream =
        event.streams?.[0];

    if (!stream) {
        console.warn(
            "No remote stream received"
        );
        return;
    }

    console.log(
        "🎧 Remote stream:",
        stream
    );

    setRemoteStream(stream);

    // =========================
    // VIDEO
    // =========================

    if (
        event.track.kind === "video" &&
        remoteVideoRef.current
    ) {

        remoteVideoRef.current.srcObject =
            stream;

        remoteVideoRef.current
            .play()
            .catch(error =>
                console.warn(
                    "Remote video play failed:",
                    error
                )
            );
    }

    // =========================
    // AUDIO
    // =========================

    if (
        event.track.kind === "audio" &&
        remoteAudioRef.current
    ) {

        remoteAudioRef.current.srcObject =
            stream;

        remoteAudioRef.current
            .play()
            .catch(error =>
                console.warn(
                    "Remote audio play failed:",
                    error
                )
            );
    }
};


    // =========================
    // ICE STATE
    // =========================

    peer.oniceconnectionstatechange = () => {

        console.log(
            "ICE state:",
            peer.iceConnectionState
        );

        if (
            peer.iceConnectionState ===
            "connected" ||
            peer.iceConnectionState ===
            "completed"
        ) {

            setCallState("connected");
        }

        if (
            peer.iceConnectionState ===
            "failed"
        ) {

            console.error(
                "ICE connection failed"
            );

            endCall(false);
        }
    };


    // =========================
    // PEER CONNECTION STATE
    // =========================

    peer.onconnectionstatechange = () => {

        console.log(
            "Peer state:",
            peer.connectionState
        );

        switch (
            peer.connectionState
        ) {

            case "connected":

                setCallState("connected");

                startCallTimer();

                clearTimeout(
                    callTimeoutRef.current
                );

                callTimeoutRef.current =
                    null;

                break;


            case "failed":

                endCall(false);

                break;


            case "closed":

                endCall(false);

                break;

            default:
                break;
        }
    };


    // =========================
    // NEGOTIATION STATE
    // =========================

    peer.onsignalingstatechange = () => {

        console.log(
            "Signaling state:",
            peer.signalingState
        );

    };


    return peer;
};

  
  const startCall = async (video = false) => {

    if (!otherUser?._id) {
        return;
    }

    if (
        callState !== "idle"
    ) {
        return;
    }

    if (
        !socket.connected
    ) {
        alert(
            "Connecting to ChatVerse server..."
        );

        return;
    }

    const peerId =
        otherUser._id.toString();

    callPeerIdRef.current =
        peerId;

    remoteDescriptionSetRef.current =
        false;

    pendingIceCandidatesRef.current =
        [];

    try {

        setIsMuted(false);
        setIsCameraOff(false);
        setCallDuration(0);

        if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
        "Camera and microphone access is not available in this browser/context."
    );
}

        const stream =
            await navigator.mediaDevices
                .getUserMedia({
                    audio: true,
                    video
                });

        localStreamRef.current =
            stream;

        setCallType(
            video ? "video" : "voice"
        );

        setCallState("calling");

        if (localVideoRef.current) {

            localVideoRef.current
                .srcObject = stream;
        }

        const peer =
            createPeerConnection();

        stream.getTracks().forEach(
            (track) => {

                peer.addTrack(
                    track,
                    stream
                );

            }
        );

        const offer =
            await peer.createOffer();

        await peer.setLocalDescription(
            offer
        );

        socket.emit(
            "call:offer",
            {
                to: peerId,
                offer:
                    peer.localDescription,
                callType:
                    video
                        ? "video"
                        : "voice"
            }
        );

        clearTimeout(
            callTimeoutRef.current
        );

        callTimeoutRef.current =
            setTimeout(() => {

                if (
                    peerConnectionRef.current
                        ?.connectionState !==
                    "connected"
                ) {

                    endCall(true);

                }

            }, 30000);

    } catch (error) {

        console.error(
            "Call start error:",
            error
        );

        endCall(false);

        alert(
    error.name === "NotAllowedError"
        ? "Please allow microphone/camera permission."
        : error.name === "NotFoundError"
            ? "No microphone/camera was found."
            : error.message ||
              "Unable to start the call."
);
    }
};

const stopScreenSharing = async () => {

    const peer =
        peerConnectionRef.current;

    const cameraTrack =
        cameraTrackRef.current;

    try {

        if (peer && cameraTrack) {

            const videoSender =
                peer.getSenders().find(
                    sender =>
                        sender.track?.kind ===
                        "video"
                );

            if (videoSender) {

                await videoSender.replaceTrack(
                    cameraTrack
                );
            }
        }

        // Stop the screen capture.
        if (screenStreamRef.current) {

            screenStreamRef.current
                .getTracks()
                .forEach(track => {
                    track.onended = null;
                    track.stop();
                });

            screenStreamRef.current =
                null;
        }

        // Restore local camera preview.
        if (
            localVideoRef.current &&
            localStreamRef.current
        ) {

            localVideoRef.current.srcObject =
                localStreamRef.current;

            localVideoRef.current.muted =
                true;

            await localVideoRef.current
                .play()
                .catch(() => {});
        }

        cameraTrackRef.current =
            null;

        setIsScreenSharing(false);

    } catch (error) {

        console.error(
            "Stop screen sharing error:",
            error
        );

    }
};

const toggleScreenShare = async () => {
    const peer = peerConnectionRef.current;

    if (!peer) {
        return;
    }

    // Screen sharing only makes sense
    // during an active video call.
    if (callType !== "video") {
        alert("Screen sharing is available during video calls only.");
        return;
    }

    try {
        // =========================
        // STOP SCREEN SHARING
        // =========================

        if (isScreenSharing) {
            await stopScreenSharing();
            return;
        }

        // =========================
        // START SCREEN SHARING
        // =========================

        const displayStream =
            await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always"
                },
                audio: false
            });

        const screenTrack =
            displayStream.getVideoTracks()[0];

        if (!screenTrack) {
            displayStream.getTracks().forEach(track => track.stop());
            return;
        }

        const videoSender =
            peer.getSenders().find(
                sender =>
                    sender.track?.kind === "video"
            );

        if (!videoSender) {
            displayStream.getTracks().forEach(track => track.stop());

            alert(
                "Unable to find the video connection."
            );

            return;
        }

        // Save the current camera track
        // before replacing it.
        const cameraTrack =
            localStreamRef.current
                ?.getVideoTracks()
                ?. [0];

        cameraTrackRef.current =
            cameraTrack || null;

        screenStreamRef.current =
            displayStream;

        // Replace camera → screen
        await videoSender.replaceTrack(
            screenTrack
        );

        // Show the screen locally.
        if (localVideoRef.current) {
            localVideoRef.current.srcObject =
                displayStream;

            localVideoRef.current.muted =
                true;

            await localVideoRef.current
                .play()
                .catch(() => {});
        }

        setIsScreenSharing(true);

        // Browser's native "Stop sharing"
        // button triggers this.
        screenTrack.onended = async () => {
            await stopScreenSharing();
        };

    } catch (error) {

        console.error(
            "Screen sharing error:",
            error
        );

        // User clicking Cancel is normal.
        if (
            error.name !==
            "NotAllowedError"
        ) {
            alert(
                error.message ||
                "Unable to start screen sharing."
            );
        }
    }
};

// =========================
// CALL CONTROLS
// =========================

const toggleMute = () => {

    const stream =
        localStreamRef.current;

    if (!stream) {
        return;
    }

    const audioTracks =
        stream.getAudioTracks();

    if (audioTracks.length === 0) {
        return;
    }

    audioTracks.forEach((track) => {
        track.enabled =
            !track.enabled;
    });

    setIsMuted((previous) =>
        !previous
    );
};


const toggleCamera = () => {

    const stream =
        localStreamRef.current;

    if (!stream) {
        return;
    }

    const videoTracks =
        stream.getVideoTracks();

    if (videoTracks.length === 0) {
        return;
    }

    videoTracks.forEach((track) => {
        track.enabled =
            !track.enabled;
    });

    setIsCameraOff((previous) =>
        !previous
    );
};

  const playMessageSound = () => {

    try {

        const saved =
            localStorage.getItem(
                "chatverseSettings"
            );

        if (!saved) return;

        const settings =
            JSON.parse(saved);

        if (!settings.sound) {
            return;
        }

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) return;

        const context =
            new AudioContext();

        const oscillator =
            context.createOscillator();

        const gain =
            context.createGain();

        oscillator.type = "sine";

        oscillator.frequency.setValueAtTime(
            700,
            context.currentTime
        );

        gain.gain.setValueAtTime(
            0.06,
            context.currentTime
        );

        oscillator.connect(gain);
        gain.connect(
            context.destination
        );

        oscillator.start();

        oscillator.stop(
            context.currentTime + 0.12
        );

    } catch (error) {

        console.error(
            "Message sound error:",
            error
        );

    }

};

   const showDesktopNotification = (
    message
) => {

    try {

        const saved =
            localStorage.getItem(
                "chatverseSettings"
            );

        if (!saved) return;

        const settings =
            JSON.parse(saved);

        if (
            settings.notifications === false
        ) {
            return;
        }

        if (
            document.visibilityState ===
            "visible"
        ) {
            return;
        }

        if (
            !("Notification" in window)
        ) {
            return;
        }

        if (
            Notification.permission !==
            "granted"
        ) {
            return;
        }

        new Notification(
            message.sender?.name ||
            "New message",
            {
                body:
                    message.content ||
                    "You received a new message",
                icon:
                    message.sender?.avatar ||
                    "/favicon.ico"
            }
        );

    } catch (error) {

        console.error(
            "Notification error:",
            error
        );

    }

};

   const acceptCall = async () => {

    if (!incomingCall) {
        return;
    }

    const callerId =
        incomingCall.from?.toString();

    if (!callerId) {
        return;
    }

    callPeerIdRef.current =
        callerId;

    remoteDescriptionSetRef.current =
        false;

    pendingIceCandidatesRef.current =
        [];

    try {

        const isVideo =
            incomingCall.callType ===
            "video";

        setIsMuted(false);
        setIsCameraOff(false);
        setCallDuration(0);

        const stream =
            await navigator.mediaDevices
                .getUserMedia({
                    audio: true,
                    video: isVideo
                });

        localStreamRef.current =
            stream;

        setCallType(
            isVideo
                ? "video"
                : "voice"
        );

        setCallState("connecting");

        if (localVideoRef.current) {

            localVideoRef.current
                .srcObject = stream;
        }

        const peer =
            createPeerConnection();

        stream.getTracks().forEach(
            (track) => {

                peer.addTrack(
                    track,
                    stream
                );

            }
        );

        await peer.setRemoteDescription(
            new RTCSessionDescription(
                incomingCall.offer
            )
        );

        remoteDescriptionSetRef.current =
            true;

        // Add ICE candidates that arrived
        // before the offer was processed.

        const pending =
            pendingIceCandidatesRef.current;

        pendingIceCandidatesRef.current =
            [];

        for (
            const candidate of pending
        ) {

            try {

                await peer.addIceCandidate(
                    new RTCIceCandidate(
                        candidate
                    )
                );

            } catch (error) {

                console.warn(
                    "Pending ICE candidate failed:",
                    error
                );

            }
        }

        const answer =
            await peer.createAnswer();

        await peer.setLocalDescription(
            answer
        );

        socket.emit(
            "call:answer",
            {
                to: callerId,
                answer:
                    peer.localDescription
            }
        );

        setIncomingCall(null);

    } catch (error) {

        console.error(
            "Accept call error:",
            error
        );

        endCall(false);

        alert(
            error.name ===
            "NotAllowedError"
                ? "Please allow microphone/camera permission."
                : "Unable to accept the call."
        );
    }
};

   const rejectCall = () => {

    if (!incomingCall) {
        return;
    }

    socket.emit(
        "call:reject",
        {
            to: incomingCall.from
        }
    );

    setIncomingCall(null);
    setCallState("idle");
};
  
   useEffect(() => {

    const loadSettings = () => {

        const saved =
            localStorage.getItem(
                "chatverseSettings"
            );

        if (!saved) return;

        try {

            const settings =
                JSON.parse(saved);

            setAutoDownload(
                settings.autoDownload ?? true
            );

        } catch (error) {
            console.error(error);
        }
    };

    loadSettings();

    window.addEventListener(
        "chatverse-settings-changed",
        loadSettings
    );

    return () => {
        window.removeEventListener(
            "chatverse-settings-changed",
            loadSettings
        );
    };

}, []);  

useEffect(() => {

    if (!showAddMembers) {
        return;
    }

    const timer = setTimeout(() => {

        searchUsersForGroup(
            memberSearch.trim()
        );

    }, 300);

    return () => clearTimeout(timer);

}, [
    memberSearch,
    showAddMembers,
    selectedChat
]);

  useEffect(() => {

    if (!selectedChat?._id) return;

    setMessages([]);
    setPolls([]);
    setIsTyping(false);

    fetchMessages();
    fetchPolls();
    markAsRead();

}, [selectedChat?._id]);

   useEffect(() => {

    if (
        !searchOpen ||
        !searchResults.length
    ) {
        return;
    }

    const message =
        searchResults[searchIndex];

    if (!message?._id) {
        return;
    }

    const element =
        messageRefs.current[
            message._id
        ];

    if (element) {

        element.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}, [
    searchIndex,
    searchQuery,
    searchOpen
]);


  useEffect(() => {
    if (!selectedChat?._id) return;

    const chatId = selectedChat._id;

    const joinRoom = () => socket.emit("joinChat", chatId);

    if (socket.connected) joinRoom();
    else socket.once("connect", joinRoom);

    return () => {
      socket.off("connect", joinRoom);
      if (socket.connected) socket.emit("leaveChat", chatId);
    };
  }, [selectedChat?._id]);

  useEffect(() => {
    const handleNewMessage = (newMessage) => {

    const incomingChatId =
        newMessage?.chat?._id?.toString() ||
        newMessage?.chat?.toString();

    // Only handle messages for the currently opened chat
    if (
        incomingChatId !==
        selectedChat?._id?.toString()
    ) {
        return;
    }


    // Add message to chat
    addMessageOnce(newMessage);


    // =========================
    // MESSAGE SETTINGS
    // =========================

    let settings = {};

    try {

        const saved =
            localStorage.getItem(
                "chatverseSettings"
            );

        settings = saved
            ? JSON.parse(saved)
            : {};

    } catch (error) {

        console.error(
            "Settings read error:",
            error
        );

    }


    // =========================
    // CHECK SENDER
    // =========================

    const senderId =
        newMessage?.sender?._id?.toString() ||
        newMessage?.sender?.toString();

    const myId =
        currentUser?._id?.toString();

    const isFromMe =
        senderId === myId;


    // =========================
    // SOUND
    // =========================

    if (
        !isFromMe &&
        !isChatMuted &&
        settings.sound !== false
    ) {
        playMessageSound();
    }


    // =========================
    // DESKTOP NOTIFICATION
    // =========================

    if (
        !isFromMe &&
        !isChatMuted &&
        settings.notifications !== false
    ) {
        showDesktopNotification(
            newMessage
        );
    }

};

    const handleTyping = ({ chatId, userId }) => {
      if (
        chatId?.toString() === selectedChat?._id?.toString() &&
        userId?.toString() !== currentUser?._id?.toString()
      ) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ chatId }) => {
      if (chatId?.toString() === selectedChat?._id?.toString()) {
        setIsTyping(false);
      }
    };

    const handleMessageEdited = (updatedMessage) => {

    setMessages((previous) =>
        previous.map((message) =>
            message._id === updatedMessage._id
                ? updatedMessage
                : message
        )
    );
  };

    const handleMessageDeleted = (updatedMessage) => {

    setMessages((previous) =>
        previous.map((message) =>
            message._id === updatedMessage._id
                ? updatedMessage
                : message
        )
    );

};

const handleMessagePinUpdated = (
    updatedMessage
) => {

    setMessages((previous) =>
        previous.map((message) =>
            message._id === updatedMessage._id
                ? updatedMessage
                : message
        )
    );
};

const handleMessagesRead = ({
    chatId,
    userId
}) => {

    if (
        chatId?.toString() !==
        selectedChat?._id?.toString()
    ) {
        return;
    }

    setMessages((previous) =>
        previous.map((message) => {

            if (
                message.sender?._id?.toString() ===
                currentUser?._id?.toString()
            ) {

                return {
                    ...message,
                    readBy: [
                        ...(message.readBy || []),
                        userId
                    ]
                };

            }

            return message;

        })
    );

};

   const handleIncomingCall = (data) => {

    console.log("Incoming call:", data);

    setIncomingCall(data);

    setCallType(
        data.callType
    );

    setCallState(
        "incoming"
    );
};

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("chatRead", handleMessagesRead);
    socket.on("messageReactionUpdated", handleReactionUpdated);
    socket.on("call:incoming", handleIncomingCall);
    // =========================
// CALL ANSWER
// =========================

const handleCallAnswered = async ({
    from,
    answer
}) => {

    if (!answer) {
        return;
    }

    if (
        callPeerIdRef.current &&
        from &&
        callPeerIdRef.current !==
            from.toString()
    ) {
        return;
    }

    const peer =
        peerConnectionRef.current;

    if (!peer) {
        return;
    }

    try {

        await peer.setRemoteDescription(
            new RTCSessionDescription(
                answer
            )
        );

        remoteDescriptionSetRef.current =
            true;

        const pending =
            pendingIceCandidatesRef.current;

        pendingIceCandidatesRef.current =
            [];

        for (
            const candidate of pending
        ) {

            try {

                await peer.addIceCandidate(
                    new RTCIceCandidate(
                        candidate
                    )
                );

            } catch (error) {

                console.warn(
                    "Pending ICE error:",
                    error
                );
            }
        }

        setCallState("connecting");

    } catch (error) {

        console.error(
            "Failed to apply call answer:",
            error
        );

        endCall(false);
    }
};
    socket.on(
    "call:answered",
    handleCallAnswered
);

// =========================
// ICE CANDIDATE
// =========================

const handleRemoteIceCandidate = async ({
    from,
    candidate
}) => {

    if (!candidate) {
        return;
    }

    if (
        callPeerIdRef.current &&
        from &&
        callPeerIdRef.current !==
            from.toString()
    ) {
        return;
    }

    const peer =
        peerConnectionRef.current;

    if (
        !peer ||
        !remoteDescriptionSetRef.current
    ) {

        pendingIceCandidatesRef.current.push(
            candidate
        );

        return;
    }

    try {

        await peer.addIceCandidate(
            new RTCIceCandidate(
                candidate
            )
        );

    } catch (error) {

        console.warn(
            "ICE candidate error:",
            error
        );
    }
};
socket.on(
    "call:ice-candidate",
    handleRemoteIceCandidate
);
const handleCallRejected = () => {

    console.log(
        "Call rejected"
    );

    endCall(false);

};
socket.on(
    "call:rejected",
    handleCallRejected
);
const handleCallEnded = () => {

    console.log(
        "Call ended by remote user"
    );

    endCall(false);

};
socket.on(
    "call:ended",
    handleCallEnded
);
    socket.on("messagePinUpdated",handleMessagePinUpdated);
    socket.on("groupUpdated",handleGroupUpdated);
    socket.on("pollCreated", (poll) => {

    const pollChatId =
        poll?.chatId?._id?.toString() ||
        poll?.chatId?.toString();

    if (
        pollChatId !==
        selectedChat?._id?.toString()
    ) {
        return;
    }

    setPolls((prev) => {

        if (
            prev.some(
                (item) =>
                    item._id === poll._id
            )
        ) {
            return prev;
        }

        return [
            ...prev,
            poll
        ];
    });
});
    socket.on("pollUpdated", (updatedPoll) => {

    setPolls((prev) =>
        prev.map((poll) =>
            poll._id === updatedPoll._id
                ? updatedPoll
                : poll
        )
    );
});

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("chatRead", handleMessagesRead);
      socket.off("messageReactionUpdated", handleReactionUpdated);
      socket.off("call:incoming", handleIncomingCall);
      socket.off(
    "call:answered",
    handleCallAnswered
);

socket.off(
    "call:ice-candidate",
    handleRemoteIceCandidate
);

socket.off(
    "call:rejected",
    handleCallRejected
);

socket.off(
    "call:ended",
    handleCallEnded
);
      socket.off("messagePinUpdated",handleMessagePinUpdated);
      socket.off(
    "groupUpdated",
    handleGroupUpdated
);
      socket.off("pollCreated");
      socket.off("pollUpdated");
    };
  }, [selectedChat?._id, currentUser?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, polls.length, isTyping]);

  if (!selectedChat) {
    return (
      <div className="h-full grid place-items-center bg-[radial-gradient(circle_at_top_right,_#312e81,_transparent_35%),linear-gradient(135deg,#0f172a,#111827)] text-white">
        <div className="text-center px-6">
          <div className="mx-auto h-24 w-24 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-xl grid place-items-center text-5xl shadow-2xl">
            💬
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight">
            Welcome to <span className="text-indigo-400">ChatVerse</span>
          </h1>
          <p className="mt-3 text-slate-400 max-w-md">
            Private conversations, real-time messaging and presence — all in one place.
          </p>
          <div className="mt-7 flex justify-center gap-3 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 px-3 py-2 bg-white/5">⚡ Real-time</span>
            <span className="rounded-full border border-white/10 px-3 py-2 bg-white/5">🔒 Private</span>
            <span className="rounded-full border border-white/10 px-3 py-2 bg-white/5">✨ Modern</span>
          </div>
        </div>
      </div>
    );
  }

    const handleToggleMute = async () => {

    if (!selectedChat?._id) {
        return;
    }

    try {

        await api.patch(
            `/chat/${selectedChat._id}/mute`
        );

        setShowChatMenu(false);

        // Refresh selected chat data
        window.dispatchEvent(
            new Event(
                "chatverse-chats-refresh"
            )
        );

    } catch (error) {

        console.error(
            "Mute chat error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Unable to change mute status"
        );
    }
};

  const handleArchiveChat = async () => {

    if (!selectedChat?._id) {
        return;
    }

    try {

        await api.patch(
            `/chat/${selectedChat._id}/archive`
        );

        setShowChatMenu(false);

        window.dispatchEvent(
            new Event(
                "chatverse-chats-refresh"
            )
        );

    } catch (error) {

        console.error(
            "Archive chat error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Unable to archive chat"
        );
    }
};

  const handleClearChat = async () => {
    const confirmed = window.confirm(
        "Are you sure you want to clear this chat?"
    );

    if (!confirmed) {
        return;
    }

    // We will connect the actual
    // clear-chat API later.

    setShowChatMenu(false);
};

    const handleForward = async () => {

    if (
        !forwardMessage ||
        selectedForwardChats.length === 0
    ) {
        return;
    }

    console.log(
        "Forwarding message:",
        forwardMessage._id
    );

    console.log(
        "Selected chats:",
        selectedForwardChats
    );

    setForwardMessage(null);
    setForwardSearch("");
    setSelectedForwardChats([]);
};


  return (
    <div className="
    relative
    h-full
    flex
    flex-col
    bg-slate-100
">

     {incomingCall && (
    <div className="
        fixed
        inset-0
        z-[200]
        bg-black/60
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-4
    ">

        <div className="
            w-full
            max-w-sm
            rounded-3xl
            bg-white
            shadow-2xl
            p-6
            text-center
        ">

            {/* CALL ICON */}
            <div className="
                mx-auto
                h-20
                w-20
                rounded-full
                bg-indigo-100
                flex
                items-center
                justify-center
                text-indigo-600
                mb-5
            ">
                {incomingCall.callType === "video" ? (
                    <Video size={34} />
                ) : (
                    <Phone size={34} />
                )}
            </div>

            {/* TITLE */}
            <h2 className="
                text-xl
                font-bold
                text-slate-800
            ">
                Incoming{" "}
                {incomingCall.callType === "video"
                    ? "Video"
                    : "Voice"}{" "}
                Call
            </h2>

            {/* CALLER */}
            <p className="
                mt-2
                text-sm
                text-slate-500
            ">
                Incoming call from{" "}
                <span className="font-semibold text-slate-700">
                    {incomingCall.from ||
                        "Someone"}
                </span>
            </p>

            {/* BUTTONS */}
            <div className="
                flex
                gap-3
                mt-7
            ">

                {/* REJECT */}
                <button
                    type="button"
                    onClick={rejectCall}
                    className="
                        flex-1
                        py-3
                        rounded-2xl
                        bg-red-500
                        hover:bg-red-600
                        text-white
                        font-semibold
                        transition
                    "
                >
                    Reject
                </button>

                {/* ACCEPT */}
                <button
                    type="button"
                    onClick={acceptCall}
                    className="
                        flex-1
                        py-3
                        rounded-2xl
                        bg-emerald-500
                        hover:bg-emerald-600
                        text-white
                        font-semibold
                        transition
                    "
                >
                    Accept
                </button>

            </div>

        </div>
    </div>
)}

     {callState !== "idle" &&
    !incomingCall && (
    <div className="
        fixed
        inset-0
        z-[190]
        bg-slate-950
        flex
        flex-col
    ">
        <audio
    ref={remoteAudioRef}
    autoPlay
    playsInline
/>

        {callType === "video" ? (
            <>

            {!remoteStream && (
    <div className="
        absolute
        inset-0
        flex
        flex-col
        items-center
        justify-center
        bg-slate-950
        text-white
        z-10
    ">
        <div className="
            h-24
            w-24
            rounded-full
            bg-indigo-500
            flex
            items-center
            justify-center
            text-4xl
        ">
            {otherUser?.avatar ? (
                <img
                    src={otherUser.avatar}
                    alt=""
                    className="
                        h-full
                        w-full
                        rounded-full
                        object-cover
                    "
                />
            ) : (
                otherUser?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "?"
            )}
        </div>

        <p className="
            mt-4
            text-lg
            font-semibold
        ">
            {otherUser?.name || "User"}
        </p>

        <p className="
            mt-1
            text-sm
            text-slate-400
        ">
            Connecting video...
        </p>
    </div>
)}

                {/* REMOTE VIDEO */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="
                        absolute
                        inset-0
                        w-full
                        h-full
                        object-cover
                        bg-black
                    "
                />

                {/* YOUR VIDEO */}
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="
                        absolute
                        right-4
                        top-4
                        w-32
                        h-44
                        md:w-48
                        md:h-64
                        object-cover
                        rounded-2xl
                        border-2
                        border-white/70
                        shadow-xl
                    "
                />
            </>
        ) : (
            /* VOICE CALL */
            <div className="
                flex-1
                flex
                flex-col
                items-center
                justify-center
                text-white
            ">

                <div className="
                    h-28
                    w-28
                    rounded-full
                    bg-indigo-500
                    flex
                    items-center
                    justify-center
                ">
                    <Phone size={42} />
                </div>

                <h2 className="
                    mt-5
                    text-2xl
                    font-bold
                ">
                    {otherUser?.name || "Voice Call"}
                </h2>

                <p className="
    mt-2
    text-slate-400
">
    {callState === "calling"
        ? "Calling..."
        : callState === "connecting"
            ? "Connecting..."
            : formatCallDuration(
                callDuration
            )}
</p>

            </div>
        )}

        {/* MUTE */}

<button
    type="button"
    onClick={toggleMute}
    className="
        h-14
        w-14
        rounded-full
        flex
        items-center
        justify-center
        transition
        bg-white/10
        hover:bg-white/20
        text-white
    "
    title={isMuted ? "Unmute" : "Mute"}
>
    {isMuted ? "🔇" : "🎤"}
</button>

      {callType === "video" && (
    <button
        type="button"
        onClick={toggleCamera}
        className="
            h-14
            w-14
            rounded-full
            flex
            items-center
            justify-center
            transition
            bg-white/10
            hover:bg-white/20
            text-white
        "
        title={
            isCameraOff
                ? "Turn camera on"
                : "Turn camera off"
        }
    >
        {isCameraOff ? "📹" : "📷"}
    </button>
)}

    {callType === "video" && (
    <button
        type="button"
        onClick={toggleScreenShare}
        title={
            isScreenSharing
                ? "Stop sharing"
                : "Share screen"
        }
        className="..."
    >
        {isScreenSharing ? "🛑" : "🖥️"}
    </button>
)}

        {/* END CALL */}
        <button
            type="button"
            onClick={endCall}
            className="
                absolute
                bottom-8
                left-1/2
                -translate-x-1/2
                h-16
                w-16
                rounded-full
                bg-red-500
                hover:bg-red-600
                text-white
                flex
                items-center
                justify-center
                shadow-xl
            "
            title="End call"
        >
            <Phone
                size={25}
                className="rotate-[135deg]"
            />
        </button>

    </div>
)}

   {forwardMessage && (
    <div className="
        fixed
        inset-0
        z-[300]
        bg-black/50
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-4
    ">

        <div className="
            w-full
            max-w-md
            max-h-[80vh]
            overflow-visible
            rounded-3xl
            bg-white
            shadow-2xl
            flex
            flex-col
        ">

            {/* HEADER */}
            <div className="
                px-5
                py-4
                border-b
                border-slate-200
                flex
                items-center
                justify-between
            ">
                <h2 className="
                    font-bold
                    text-slate-800
                ">
                    Forward message
                </h2>

                <button
                    type="button"
                    onClick={() =>
                        setForwardMessage(null)
                    }
                    className="
                        h-9
                        w-9
                        rounded-xl
                        grid
                        place-items-center
                        hover:bg-slate-100
                    "
                >
                    <X size={18} />
                </button>
            </div>

            {/* MESSAGE PREVIEW */}
            <div className="
                mx-5
                mt-4
                p-3
                rounded-xl
                bg-slate-100
                text-sm
                text-slate-700
            ">
                {forwardMessage.content ||
                    "Attachment"}
            </div>

            {/* SEARCH */}
            <div className="px-5 pt-4">

                <input
                    value={forwardSearch}
                    onChange={(e) =>
                        setForwardSearch(
                            e.target.value
                        )
                    }
                    placeholder="Search chats..."
                    className="
                        w-full
                        px-4
                        py-3
                        rounded-xl
                        bg-slate-100
                        outline-none
                        focus:ring-2
                        focus:ring-indigo-500
                    "
                />

            </div>

            {/* CHAT LIST */}
            <div className="
                flex-1
                overflow-y-auto
                p-3
                mt-2
            ">

                {chats
                    ?.filter((chat) =>
                        chat._id !==
                        selectedChat?._id
                    )
                    .filter((chat) =>
                        chat.participants?.some(
                            (person) =>
                                person.name
                                    ?.toLowerCase()
                                    .includes(
                                        forwardSearch
                                            .toLowerCase()
                                    )
                        )
                    )
                    .map((chat) => {

                        const person =
                            chat.participants?.find(
                                (p) =>
                                    p._id !==
                                    currentUser?._id
                            );

                        const selected =
                            selectedForwardChats.includes(
                                chat._id
                            );

                        return (
                            <button
                                key={chat._id}
                                type="button"
                                onClick={() => {

                                    setSelectedForwardChats(
                                        previous =>
                                            selected
                                                ? previous.filter(
                                                    id =>
                                                        id !==
                                                        chat._id
                                                )
                                                : [
                                                    ...previous,
                                                    chat._id
                                                ]
                                    );

                                }}
                                className={`
                                    w-full
                                    flex
                                    items-center
                                    gap-3
                                    p-3
                                    rounded-xl
                                    transition
                                    ${
                                        selected
                                            ? "bg-indigo-50"
                                            : "hover:bg-slate-100"
                                    }
                                `}
                            >

                                <div className="
                                    h-11
                                    w-11
                                    rounded-full
                                    bg-indigo-100
                                    grid
                                    place-items-center
                                    overflow-hidden
                                ">
                                    {person?.avatar ? (
                                        <img
                                            src={
                                                person.avatar
                                            }
                                            alt=""
                                            className="
                                                h-full
                                                w-full
                                                object-cover
                                            "
                                        />
                                    ) : (
                                        person?.name
                                            ?.charAt(0)
                                            ?.toUpperCase()
                                    )}
                                </div>

                                <span className="
                                    flex-1
                                    text-left
                                    font-medium
                                    text-slate-800
                                ">
                                    {person?.name}
                                </span>

                                {selected && (
                                    <span className="
                                        h-6
                                        w-6
                                        rounded-full
                                        bg-indigo-600
                                        text-white
                                        grid
                                        place-items-center
                                        text-xs
                                    ">
                                        ✓
                                    </span>
                                )}

                            </button>
                        );
                    })}

            </div>

            {/* FOOTER */}
            <div className="
                p-4
                border-t
                border-slate-200
                flex
                justify-end
                gap-3
            ">

                <button
                    type="button"
                    onClick={() =>
                        setForwardMessage(null)
                    }
                    className="
                        px-4
                        py-2.5
                        rounded-xl
                        text-slate-600
                        hover:bg-slate-100
                    "
                >
                    Cancel
                </button>

                <button
                    type="button"
                    disabled={
                        selectedForwardChats.length === 0
                    }
                    className="
                        px-5
                        py-2.5
                        rounded-xl
                        bg-indigo-600
                        text-white
                        font-semibold
                        disabled:opacity-40
                    "
                >
                    Send
                </button>

            </div>

        </div>

    </div>
)}

      <header className="relative
    z-[150]
    h-[64px]
    md:h-[76px]
    shrink-0
    bg-white/95
    backdrop-blur
    border-b
    border-slate-200
    px-5
    flex
    items-center
    justify-between">
      

    {/* User information */}
    <button
    type="button"
    onClick={() => setShowChatInfo(true)}
    className="
        flex
        items-center
        gap-3
        min-w-0
        text-left
        rounded-xl
        px-2
        py-1.5
        -ml-2
        hover:bg-slate-100
        transition
    "
>
    {/* AVATAR */}

    <div className="
        relative
        h-10
        w-10
        md:h-11
        md:w-11
        shrink-0
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

        {chatDisplayAvatar ? (

            <img
                src={chatDisplayAvatar}
                alt={chatDisplayName}
                className="
                    w-full
                    h-full
                    object-cover
                "
            />

        ) : isGroupChat ? (

            <Users size={21} />

        ) : (

            chatDisplayName
                ?.charAt(0)
                ?.toUpperCase() || "?"

        )}

        {/* ONLINE DOT — P2P ONLY */}

        {!isGroupChat && isOnline && (
            <span className="
                absolute
                right-0
                bottom-0
                h-3
                w-3
                rounded-full
                bg-emerald-500
                border-2
                border-white"
            />
        )}

    </div>


    {/* NAME + STATUS */}

<div className="min-w-0">

    <h2 className="
        font-bold
        text-sm
        md:text-base
        text-slate-800
        truncate
        max-w-[150px]
        md:max-w-[260px]
    ">
        {chatDisplayName}
    </h2>

    <p className="
        text-xs
        text-slate-500
        truncate
    ">
        {isGroupChat
            ? `${selectedChat?.participants?.length || 0} members`
            : isTyping
                ? "typing..."
                : isOnline
                    ? "Online"
                    : "Offline"
        }
    </p>

</div>

</button>



        <div className="relative flex items-center gap-1">

    {/* SEARCH - DESKTOP ONLY */}
    <button
        type="button"
        onClick={() => {
            setSearchOpen(true);
            setSearchIndex(0);
        }}
        className="
            hidden md:grid
            h-10 w-10
            place-items-center
            rounded-xl
            text-slate-500
            hover:bg-slate-100
            hover:text-indigo-600
            transition
        "
        title="Search messages"
    >
        <Search size={19} />
    </button>


    {/* VOICE CALL */}
    <button
        type="button"
        onClick={() => {

    console.log("📞 Voice call clicked");

    console.log(
        "Socket connected:",
        socket.connected
    );

    console.log(
        "Other user:",
        otherUser
    );

    startCall(false);
}}
        disabled={!isOnline}
        className="
            h-10 w-10
            grid
            place-items-center
            rounded-xl
            text-slate-500
            hover:bg-slate-100
            hover:text-indigo-600
            disabled:opacity-40
            disabled:cursor-not-allowed
            transition
        "
        title={
            isOnline
                ? "Voice call"
                : "User is offline"
        }
    >
        <Phone size={19} />
    </button>


    {/* VIDEO CALL */}
    <button
        type="button"
        onClick={() => startCall(true)}
        disabled={!isOnline}
        className="
            h-10 w-10
            grid
            place-items-center
            rounded-xl
            text-slate-500
            hover:bg-slate-100
            hover:text-indigo-600
            disabled:opacity-40
            disabled:cursor-not-allowed
            transition
        "
        title={
            isOnline
                ? "Video call"
                : "User is offline"
        }
    >
        <Video size={19} />
    </button>

   {/* THREE DOT MENU */}
<div className="relative z-[999]">

    


    <button
        type="button"
        onClick={() => setShowChatMenu(prev => !prev)}
        className="
            h-10 w-10
            grid place-items-center
            rounded-xl
            text-slate-500
            hover:bg-slate-100
            hover:text-indigo-600
            transition
        "
        title="More options"
    >
        <MoreVertical size={19} />
    </button>


    {showChatMenu && (
        <div
            className="
                absolute
                right-0
                top-full
                mt-2
                z-[9999]
                w-56
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-2xl
                p-1
            "
        >


            <button
                type="button"
                onClick={handleToggleMute}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-slate-100"
            >
                {isChatMuted ? (
                    <Bell size={17} />
                ) : (
                    <BellOff size={17} />
                )}


                {isChatMuted
                    ? "Unmute notifications"
                    : "Mute notifications"}
            </button>


            <button
                type="button"
                onClick={handleArchiveChat}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-slate-100"
            >
                <Archive size={17} />
                Archive chat
            </button>


            <button
                type="button"
                onClick={handleClearChat}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50"
            >
                <Trash2 size={17} />
                Clear chat
            </button>
    

            <div className="
                my-1
                border-t
                border-slate-100
            " />

            {/* CLOSE */}
            <button
                type="button"
                onClick={() =>
                    setShowChatMenu(false)
                }
                className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-3
                    py-2.5
                    rounded-xl
                    text-sm
                    text-slate-500
                    hover:bg-slate-100
                    transition
                "
            >
                <X size={17} />
                Close
            </button>

        </div>
    )}

</div>


</div>
      </header>
    
       {showChatInfo && (
    <div className="
        absolute
        inset-0
        z-[180]
        bg-white
        flex
        flex-col
    ">

        {showEditGroup && isGroupChat && (
    <div className="
        fixed
        inset-0
        z-[400]
        bg-black/50
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
            bg-white
            shadow-2xl
            overflow-hidden
        ">

            {/* HEADER */}

            <div className="
                px-5
                py-4
                border-b
                border-slate-200
                flex
                items-center
                justify-between
            ">

                <h2 className="
                    text-lg
                    font-bold
                    text-slate-800
                ">
                    Edit Group
                </h2>

                <button
                    type="button"
                    onClick={() =>
                        setShowEditGroup(false)
                    }
                    className="
                        h-9
                        w-9
                        rounded-xl
                        grid
                        place-items-center
                        hover:bg-slate-100
                    "
                >
                    <X size={18} />
                </button>

            </div>

            <div className="p-5 space-y-5">

                {/* GROUP DP */}

                <div className="
                    flex
                    flex-col
                    items-center
                ">

                    <div className="
                        relative
                        h-28
                        w-28
                        rounded-full
                        overflow-hidden
                        bg-gradient-to-br
                        from-indigo-500
                        to-violet-600
                        flex
                        items-center
                        justify-center
                        text-white
                        text-3xl
                        font-bold
                    ">

                        {groupAvatarPreview ? (
                            <img
                                src={groupAvatarPreview}
                                alt="Group"
                                className="
                                    h-full
                                    w-full
                                    object-cover
                                "
                            />
                        ) : (
                            editGroupName
                                ?.charAt(0)
                                ?.toUpperCase() || "G"
                        )}

                        <label
    className="
        absolute
        bottom-0
        left-0
        right-0
        py-2
        bg-black/50
        text-white
        text-xs
        font-semibold
        text-center
        cursor-pointer
        hover:bg-black/60
        transition
    "
>
    <Camera
        size={15}
        className="
            inline
            mr-1
        "
    />

    Change DP

    <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {

            const file =
                e.target.files?.[0];

            if (!file) {
                return;
            }

            // 5 MB limit
            if (
                file.size >
                5 * 1024 * 1024
            ) {
                alert(
                    "Image must be smaller than 5 MB"
                );

                e.target.value = "";
                return;
            }

            setGroupAvatarFile(file);

            // Local preview
            const previewUrl =
                URL.createObjectURL(file);

            setGroupAvatarPreview(
                previewUrl
            );
        }}
    />
</label>

                    </div>

                    <p className="
    mt-2
    text-xs
    text-slate-400
">
    {groupAvatarFile
        ? groupAvatarFile.name
        : "Click Change DP to select a photo"}
</p>

                </div>

                {/* GROUP NAME */}

                <div>

                    <label className="
                        text-xs
                        font-semibold
                        text-slate-500
                    ">
                        Group name
                    </label>

                    <input
                        value={editGroupName}
                        onChange={(e) =>
                            setEditGroupName(
                                e.target.value
                            )
                        }
                        className="
                            mt-1
                            w-full
                            px-4
                            py-3
                            rounded-xl
                            bg-slate-100
                            outline-none
                            focus:ring-2
                            focus:ring-indigo-500
                        "
                        placeholder="Group name"
                    />

                </div>

                {/* DESCRIPTION */}

                <div>

                    <label className="
                        text-xs
                        font-semibold
                        text-slate-500
                    ">
                        Description
                    </label>

                    <textarea
                        value={groupDescription}
                        onChange={(e) =>
                            setGroupDescription(
                                e.target.value
                            )
                        }
                        rows={4}
                        maxLength={200}
                        className="
                            mt-1
                            w-full
                            px-4
                            py-3
                            rounded-xl
                            bg-slate-100
                            outline-none
                            resize-none
                            focus:ring-2
                            focus:ring-indigo-500
                        "
                        placeholder="
                            Add a group description...
                        "
                    />

                    <p className="
                        mt-1
                        text-right
                        text-[11px]
                        text-slate-400
                    ">
                        {groupDescription.length}/200
                    </p>

                </div>

                {/* SAVE */}

                <button
                    type="button"
                    onClick={handleEditGroup}
                    disabled={savingGroup}
                    className="
                        w-full
                        py-3
                        rounded-xl
                        bg-indigo-600
                        hover:bg-indigo-700
                        text-white
                        font-semibold
                        flex
                        items-center
                        justify-center
                        gap-2
                        disabled:opacity-50
                    "
                >

                    <Save size={17} />

                    {savingGroup
                        ? "Saving..."
                        : "Save Changes"}

                </button>

            </div>

        </div>

    </div>
)}

        {/* INFO HEADER */}

        <div className="
            h-[64px]
            md:h-[76px]
            shrink-0
            px-4
            border-b
            border-slate-200
            flex
            items-center
            gap-3
        ">

            <button
                type="button"
                onClick={() => setShowChatInfo(false)}
                className="
                    h-10
                    w-10
                    rounded-xl
                    grid
                    place-items-center
                    text-slate-500
                    hover:bg-slate-100
                    hover:text-indigo-600
                "
            >
                <ArrowLeft size={20} />
            </button>

            <h2 className="
                text-lg
                font-bold
                text-slate-800
            ">
                {isGroupChat
                    ? "Group Info"
                    : "Contact Info"}
            </h2>

        </div>
      
      
        {/* PROFILE */}

        <div className="
            shrink-0
            px-5
            py-8
            text-center
            border-b
            border-slate-200
        ">

            <div className="
                mx-auto
                h-28
                w-28
                rounded-full
                overflow-hidden
                bg-gradient-to-br
                from-indigo-500
                to-violet-600
                flex
                items-center
                justify-center
                text-white
                text-4xl
                font-bold
            ">

                {chatDisplayAvatar ? (

                    <img
                        src={chatDisplayAvatar}
                        alt={chatDisplayName}
                        className="
                            w-full
                            h-full
                            object-cover
                        "
                    />

                ) : isGroupChat ? (

                    <Users size={42} />

                ) : (

                    chatDisplayName
                        ?.charAt(0)
                        ?.toUpperCase() || "?"

                )}

            </div>


            <h1 className="
                mt-4
                text-xl
                font-bold
                text-slate-800
            ">
                {chatDisplayName}
            </h1>


            <p className="
                mt-1
                text-sm
                text-slate-500
            ">
                {isGroupChat
                    ? `${selectedChat?.participants?.length || 0} members`
                    : otherUser?.email || "No email available"}
            </p>

        </div>

        {isGroupChat && isGroupAdmin && (
    <button
        type="button"
        onClick={() => {

            setEditGroupName(
                selectedChat?.chatName || ""
            );

            setGroupDescription(
                selectedChat?.groupDescription || ""
            );

            setGroupAvatarPreview(
                selectedChat?.groupAvatar || ""
            );
            setGroupAvatarFile(null);
            setShowEditGroup(true);
        }}
        className="
            w-full
            mb-3
            px-4
            py-3
            rounded-2xl
            bg-slate-100
            text-slate-700
            font-semibold
            text-sm
            flex
            items-center
            justify-center
            gap-2
            hover:bg-slate-200
            transition
        "
    >
        <Pencil size={17} />
        Edit Group
    </button>
)}

   {isGroupChat && isGroupAdmin && (
    <button
        type="button"
        onClick={() => {
            setShowAddMembers(true);
            setMemberSearch("");
            setSelectedMembers([]);
        }}
        className="
            w-full
            mb-5
            px-4
            py-3
            rounded-2xl
            bg-indigo-50
            text-indigo-600
            font-semibold
            text-sm
            flex
            items-center
            justify-center
            gap-2
            hover:bg-indigo-100
            transition
        "
    >
        <Users size={18} />
        Add Members
    </button>
)}

        {/* CONTENT */}

        <div className="
            flex-1
            overflow-y-auto
            p-4
        ">

            {isGroupChat ? (

                <>
                    <p className="
                        px-2
                        mb-3
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                    ">
                        Members
                    </p>


                    <div className="
                        rounded-2xl
                        border
                        border-slate-200
                        overflow-hidden
                    ">

                        {selectedChat?.participants?.map((member) => {

    const groupAdminId =
    selectedChat?.groupAdmin?._id?.toString() ||
    selectedChat?.groupAdmin?.toString();

const memberId =
    member?._id?.toString();

const currentUserId =
    currentUser?._id?.toString();

const isAdmin =
    groupAdminId === memberId;

const isCurrentUser =
    currentUserId === memberId;

const currentUserIsAdmin =
    groupAdminId === currentUserId;

    return (
        <div
            key={member._id}
            className="
                flex
                items-center
                gap-3
                px-4
                py-3
                border-b
                border-slate-100
            "
        >

            {/* AVATAR */}

            <div
                className="
                    h-10
                    w-10
                    rounded-full
                    bg-indigo-100
                    text-indigo-600
                    flex
                    items-center
                    justify-center
                    font-bold
                    shrink-0
                    overflow-hidden
                "
            >
                {member.avatar ? (
                    <img
                        src={member.avatar}
                        alt={member.name}
                        className="
                            w-full
                            h-full
                            object-cover
                        "
                    />
                ) : (
                    member.name
                        ?.charAt(0)
                        ?.toUpperCase() || "?"
                )}
            </div>

            {/* NAME */}

            <div className="flex-1 min-w-0">

                <p className="
                    text-sm
                    font-semibold
                    text-slate-800
                    truncate
                ">
                    {member.name}

                    {isCurrentUser && (
                        <span className="
                            ml-2
                            text-xs
                            text-slate-400
                        ">
                            You
                        </span>
                    )}
                </p>

                <p className="
                    text-xs
                    text-slate-400
                    truncate
                ">
                    {member.email}
                </p>

            </div>

            {/* ADMIN */}

            {isAdmin && (
                <span className="
                    text-xs
                    font-semibold
                    text-indigo-600
                    bg-indigo-50
                    px-2
                    py-1
                    rounded-full
                ">
                    Admin
                </span>
            )}

            {currentUserIsAdmin &&
    !isCurrentUser &&
    !isAdmin && (

    <button
        type="button"
        onClick={() =>
            handleTransferAdmin(
                member._id,
                member.name
            )
        }
        className="
            shrink-0
            px-3
            py-1.5
            rounded-lg
            text-xs
            font-semibold
            text-indigo-600
            bg-indigo-50
            border
            border-indigo-100
            hover:bg-indigo-100
            transition
        "
    >
        Make Admin
    </button>
)}

            {/* REMOVE MEMBER */}

{isGroupChat &&
    currentUserIsAdmin &&
    !isCurrentUser &&
    !isAdmin && (

    <button
        type="button"
        onClick={() =>
            handleRemoveMember(
                member._id,
                member.name
            )
        }
        className="
            shrink-0
            px-3
            py-1.5
            rounded-lg
            text-xs
            font-semibold
            text-red-600
            bg-red-50
            border
            border-red-100
            hover:bg-red-100
            active:bg-red-200
            transition
        "
    >
        Remove
    </button>

)}

        </div>
        
    );
})}

                    </div>


                    {/* ========================= */}
                    {/* GROUP SETTINGS */}
                    {/* ========================= */}

                    {isGroupChat && isGroupAdmin && (
                        <div className="
                            mt-6
                            border-t
                            border-slate-200
                            pt-5
                        ">

                            <h3 className="
                                px-2
                                mb-3
                                text-xs
                                font-bold
                                uppercase
                                tracking-wider
                                text-slate-400
                            ">
                                Group Settings
                            </h3>

                            <div className="
                                rounded-2xl
                                border
                                border-slate-200
                                overflow-hidden
                                bg-white
                            ">

                                {/* EVERYONE */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleGroupSendPermission(false)
                                    }
                                    className="
                                        w-full
                                        px-4
                                        py-4
                                        flex
                                        items-center
                                        gap-3
                                        text-left
                                        hover:bg-slate-50
                                        transition
                                    "
                                >

                                    <div className="
                                        h-9
                                        w-9
                                        shrink-0
                                        rounded-xl
                                        bg-emerald-50
                                        text-emerald-600
                                        flex
                                        items-center
                                        justify-center
                                    ">
                                        ✓
                                    </div>

                                    <div className="flex-1">

                                        <p className="
                                            text-sm
                                            font-semibold
                                            text-slate-800
                                        ">
                                            Everyone
                                        </p>

                                        <p className="
                                            text-xs
                                            text-slate-400
                                        ">
                                            All members can send messages
                                        </p>

                                    </div>

                                    {!selectedChat?.onlyAdminsCanSend && (
                                        <span className="
                                            h-5
                                            w-5
                                            shrink-0
                                            rounded-full
                                            bg-indigo-600
                                            text-white
                                            flex
                                            items-center
                                            justify-center
                                            text-xs
                                        ">
                                            ✓
                                        </span>
                                    )}

                                </button>


                                {/* ONLY ADMINS */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleGroupSendPermission(true)
                                    }
                                    className="
                                        w-full
                                        px-4
                                        py-4
                                        flex
                                        items-center
                                        gap-3
                                        text-left
                                        border-t
                                        border-slate-100
                                        hover:bg-slate-50
                                        transition
                                    "
                                >

                                    <div className="
                                        h-9
                                        w-9
                                        shrink-0
                                        rounded-xl
                                        bg-indigo-50
                                        text-indigo-600
                                        flex
                                        items-center
                                        justify-center
                                    ">
                                        👑
                                    </div>

                                    <div className="flex-1">

                                        <p className="
                                            text-sm
                                            font-semibold
                                            text-slate-800
                                        ">
                                            Only admins
                                        </p>

                                        <p className="
                                            text-xs
                                            text-slate-400
                                        ">
                                            Only admins can send messages
                                        </p>

                                    </div>

                                    {selectedChat?.onlyAdminsCanSend && (
                                        <span className="
                                            h-5
                                            w-5
                                            shrink-0
                                            rounded-full
                                            bg-indigo-600
                                            text-white
                                            flex
                                            items-center
                                            justify-center
                                            text-xs
                                        ">
                                            ✓
                                        </span>
                                    )}

                                </button>

                            </div>

                        </div>
                    )}

                    {isGroupChat && isGroupAdmin && (
    <button
        type="button"
        onClick={() => {
            setAnnouncementText(
                selectedChat?.announcement?.content || ""
            );

            setShowAnnouncement(true);
        }}
        className="
            w-full
            mt-5
            px-4
            py-3
            rounded-2xl
            bg-amber-50
            text-amber-700
            font-semibold
            text-sm
            flex
            items-center
            justify-center
            gap-2
            hover:bg-amber-100
            transition
        "
    >
        📢
        {selectedChat?.announcement?.isActive
            ? "Edit Announcement"
            : "Create Announcement"}
    </button>
)}

      
                {/* EXIT GROUP */}

                    <button
                        type="button"
                        onClick={handleExitGroup}
                        className="
                            w-full
                            mt-5
                            px-4
                            py-3
                            rounded-2xl
                            bg-red-50
                            text-red-600
                            font-semibold
                            text-sm
                            flex
                            items-center
                            justify-center
                            gap-2
                            hover:bg-red-100
                            transition
                        "
                    >
                        <LogOut size={18} />
                        Exit Group
                    </button>

                </>

            ) : (

                <>
                    <p className="
                        px-2
                        mb-3
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                    ">
                        About
                    </p>


                    <div className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-4
                    ">

                        <p className="
                            text-xs
                            text-slate-400
                        ">
                            Email
                        </p>

                        <p className="
                            mt-1
                            text-sm
                            font-semibold
                            text-slate-800
                            break-all
                        ">
                            {otherUser?.email ||
                                "Not available"}
                        </p>

                    </div>

                </>

            )}

        </div>

    </div>
)}

    {showAddMembers && (
    <div className="
        absolute
        inset-0
        z-[220]
        bg-white
        flex
        flex-col
    ">

        {/* HEADER */}

        <div className="
            h-[64px]
            md:h-[76px]
            shrink-0
            px-4
            border-b
            border-slate-200
            flex
            items-center
            gap-3
        ">

            <button
                type="button"
                onClick={() => {
                    setShowAddMembers(false);
                    setSelectedMembers([]);
                    setMemberSearch("");
                }}
                className="
                    h-10
                    w-10
                    rounded-xl
                    grid
                    place-items-center
                    text-slate-500
                    hover:bg-slate-100
                "
            >
                <ArrowLeft size={20} />
            </button>

            <div>

                <h2 className="
                    font-bold
                    text-slate-800
                ">
                    Add Members
                </h2>

                <p className="
                    text-xs
                    text-slate-400
                ">
                    Select people to add
                </p>

            </div>

        </div>


        {/* SEARCH */}

        <div className="p-4">

            <div className="relative">

                <Search
                    size={18}
                    className="
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-slate-400
                    "
                />

                <input
                    value={memberSearch}
                    onChange={(e) =>
                        setMemberSearch(
                            e.target.value
                        )
                    }
                    placeholder="Search people..."
                    className="
                        w-full
                        pl-10
                        pr-4
                        py-3
                        rounded-xl
                        bg-slate-100
                        border
                        border-slate-200
                        outline-none
                        text-sm
                        text-slate-800
                        focus:border-indigo-500
                    "
                />

            </div>

        </div>


        {/* SELECTED COUNT */}

        {selectedMembers.length > 0 && (
            <div className="
                px-4
                pb-3
                text-sm
                font-semibold
                text-indigo-600
            ">
                {selectedMembers.length} selected
            </div>
        )}


        {/* USERS */}

        <div className="
            flex-1
            overflow-y-auto
            px-4
        ">

            {availableUsers.length === 0 ? (

                <div className="
                    py-12
                    text-center
                    text-slate-400
                    text-sm
                ">
                    {memberSearch.trim()
                        ? "No users found"
                        : "Search for people to add"}
                </div>

            ) : (

                <div className="
                    rounded-2xl
                    border
                    border-slate-200
                    overflow-hidden
                ">

                    {availableUsers.map(
                        user => {

                            const selected =
                                selectedMembers.includes(
                                    user._id
                                );

                            return (
                                <button
                                    key={user._id}
                                    type="button"
                                    onClick={() =>
                                        toggleGroupMember(
                                            user._id
                                        )
                                    }
                                    className="
                                        w-full
                                        px-4
                                        py-3
                                        flex
                                        items-center
                                        gap-3
                                        text-left
                                        border-b
                                        border-slate-100
                                        last:border-b-0
                                        hover:bg-slate-50
                                    "
                                >

                                    <div className="
                                        h-10
                                        w-10
                                        shrink-0
                                        rounded-full
                                        bg-indigo-100
                                        text-indigo-600
                                        flex
                                        items-center
                                        justify-center
                                        font-bold
                                    ">

                                        {user.avatar ? (

                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="
                                                    w-full
                                                    h-full
                                                    rounded-full
                                                    object-cover
                                                "
                                            />

                                        ) : (

                                            user.name
                                                ?.charAt(0)
                                                ?.toUpperCase() || "?"

                                        )}

                                    </div>


                                    <div className="
                                        flex-1
                                        min-w-0
                                    ">

                                        <p className="
                                            text-sm
                                            font-semibold
                                            text-slate-800
                                            truncate
                                        ">
                                            {user.name}
                                        </p>

                                        <p className="
                                            text-xs
                                            text-slate-400
                                            truncate
                                        ">
                                            {user.email}
                                        </p>

                                    </div>


                                    {/* CHECK */}

                                    <div className={`
                                        h-6
                                        w-6
                                        rounded-full
                                        border-2
                                        flex
                                        items-center
                                        justify-center
                                        ${
                                            selected
                                                ? "bg-indigo-600 border-indigo-600"
                                                : "border-slate-300"
                                        }
                                    `}>

                                        {selected && (
                                            <span className="
                                                text-white
                                                text-xs
                                                font-bold
                                            ">
                                                ✓
                                            </span>
                                        )}

                                    </div>

                                </button>
                            );
                        }
                    )}

                </div>

            )}

        </div>


        {/* FOOTER */}

        <div className="
            shrink-0
            p-4
            border-t
            border-slate-200
        ">

            <button
                type="button"
                onClick={handleAddMembers}
                disabled={
                    addingMembers ||
                    selectedMembers.length === 0
                }
                className="
                    w-full
                    py-3
                    rounded-xl
                    bg-indigo-600
                    text-white
                    font-semibold
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    hover:bg-indigo-700
                    transition
                "
            >
                {addingMembers
                    ? "Adding..."
                    : `Add ${
                        selectedMembers.length
                    } Member${
                        selectedMembers.length === 1
                            ? ""
                            : "s"
                    }`}
            </button>

        </div>

    </div>
)}

      {pinnedMessage && (
    <button
        type="button"
        onClick={scrollToPinnedMessage}
        className="
            w-full
            px-4
            py-2.5
            bg-indigo-50
            border-b
            border-indigo-100
            flex
            items-center
            gap-3
            text-left
            hover:bg-indigo-100
            transition
        "
    >

        <div className="
            h-8
            w-8
            shrink-0
            rounded-lg
            bg-indigo-100
            text-indigo-600
            grid
            place-items-center
        ">
            <Pin size={15} />
        </div>

        <div className="min-w-0 flex-1">

            <p className="
                text-[11px]
                font-bold
                uppercase
                tracking-wide
                text-indigo-600
            ">
                Pinned message
            </p>

            <p className="
                text-sm
                text-slate-700
                truncate
            ">
                {pinnedMessage.content ||
                    "Pinned message"}
            </p>

        </div>

        <span className="
            text-xs
            font-semibold
            text-indigo-500
            shrink-0
        ">
            View
        </span>

    </button>
)}

      {searchOpen && (
    <div className="
        border-b
        border-slate-200
        bg-white
        px-3
        py-2
        flex
        items-center
        gap-2
        z-30
    ">
        {/* search input */}
        <div className="
    flex
    items-center
    gap-2
    flex-1
    bg-slate-100
    rounded-xl
    px-3
">

    <Search
        size={17}
        className="text-slate-400 shrink-0"
    />

    <input
        autoFocus
        type="text"
        value={searchQuery}
        onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchIndex(0);
        }}
        onKeyDown={(e) => {

    if (e.key !== "Enter") {
        return;
    }

    // Shift + Enter = new line
    if (e.shiftKey) {
        return;
    }

    // Enter to send ON
    if (enterToSend) {

        e.preventDefault();

        handleSend(e);

    }

}}
        placeholder="Search messages..."
        className="
            flex-1
            bg-transparent
            outline-none
            text-sm
            py-2.5
        "
    />

    {searchQuery && (
        <span className="
            text-xs
            text-slate-500
            whitespace-nowrap
        ">
            {searchResults.length
                ? `${searchIndex + 1} / ${searchResults.length}`
                : "No results"}
        </span>
    )}

</div>

<button
    type="button"
    onClick={() => {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchIndex(0);
    }}
    className="
        h-9
        w-9
        shrink-0
        rounded-lg
        hover:bg-slate-100
        text-slate-500
        grid
        place-items-center
        text-xl
    "
>
    ×
</button>
    </div>
)}

      <div className="flex-1 overflow-y-auto p-3 md:p-7 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,.08),transparent_25%)]">
        {loading ? (
          <div className="h-full grid place-items-center text-slate-400">Loading messages...</div>
        ) : messages.length === 0 && polls.length === 0 ? (
          <div className="h-full grid place-items-center">
            <div className="text-center">
              <div className="text-4xl">👋</div>
              <p className="mt-3 font-semibold text-slate-600">Start the conversation</p>
              <p className="text-sm text-slate-400">Your messages are delivered in real time.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">

            {isGroupChat &&
    selectedChat?.announcement?.isActive &&
    selectedChat?.announcement?.content && (

    <div className="
        mx-3
        md:mx-auto
        max-w-4xl
        mt-3
        mb-2
        rounded-2xl
        border
        border-amber-200
        bg-amber-50
        px-4
        py-3
        shadow-sm
    ">

        <div className="
            flex
            items-start
            gap-3
        ">

            <div className="
                h-9
                w-9
                shrink-0
                rounded-xl
                bg-amber-100
                flex
                items-center
                justify-center
            ">
                📢
            </div>

            <div className="flex-1 min-w-0">

                <p className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-amber-700
                ">
                    Group Announcement
                </p>

                <p className="
                    mt-1
                    text-sm
                    text-slate-700
                    whitespace-pre-wrap
                    break-words
                ">
                    {selectedChat.announcement.content}
                </p>

            </div>

            {isGroupAdmin && (
                <button
                    type="button"
                    onClick={
                        handleDeleteAnnouncement
                    }
                    className="
                        shrink-0
                        text-xs
                        text-red-500
                        hover:text-red-700
                    "
                >
                    Remove
                </button>
            )}

        </div>

    </div>
)}
            
            {[
        ...messages.map((message) => ({
            type: "message",
            data: message,
            date: new Date(
                message.createdAt
            ).getTime()
        })),

        ...polls.map((poll) => ({
            type: "poll",
            data: poll,
            date: new Date(
                poll.createdAt
            ).getTime()
        }))
    ]
        .sort((a, b) => a.date - b.date)
        .map((item) => {

            if (item.type === "poll") {

    return (
        <div
            key={`poll-${item.data._id}`}
            className="flex justify-start"
        >
            <PollCard
                poll={item.data}
                currentUserId={
                    currentUser?._id
                }
            />
        </div>
    );
}

const message = item.data;

    const isMine =
        message.sender?._id?.toString() ===
        currentUser?._id?.toString();

    return (
        <div
            key={message._id}
            ref={(element) => {
    messageRefs.current[message._id] =
        element;
}}
            className={`flex ${
                 message.messageType === "system"
        ? "justify-center"
                : isMine
                    ? "justify-end"
                    : "justify-start"
            }`}
        >

            {/* MESSAGE WRAPPER */}
            <div
    className={`
        relative
        group
        ${
            message.messageType === "system"
                ? "w-full flex justify-center"
                : "max-w-[85%] sm:max-w-[75%]"
        }
        ${
            isMine &&
            message.messageType !== "system"
                ? "mr-9"
                : ""
        }
    `}
>

                {/* =========================
                    THREE DOT
                    ========================= */}

                {isMine && !message.deleted && (
                    <button
                        onClick={() =>
                            setActiveMessage(
                                activeMessage === message._id
                                    ? null
                                    : message._id
                            )
                        }
                           className="
                    absolute
                    -right-9
                    top-1/2
                    -translate-y-1/2
                    h-8
                    w-8
                    rounded-full
                    grid
                    place-items-center
                    text-slate-400
                    hover:bg-slate-200
                    hover:text-slate-700
                    opacity-0
                    group-hover:opacity-100
                    transition
                "
                        title="Message options"
                    >
                        <MoreVertical size={17} />
                    </button>
                )}


                {/* =========================
                    MESSAGE MENU
                    ========================= */}

                {isMine &&
                    !message.deleted &&
                    activeMessage === message._id && (

                    <div
                        className="
                        absolute
                        right-0
                        top-full
                        mt-2
                        z-[9999]
                        w-44
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        shadow-2xl
                        p-1
                    "
                    >

                      {/* REPLY */}

                      <button
    onClick={() => {

        setReplyingTo(message);
        setActiveMessage(null);

    }}
    className="
        w-full
        flex
        items-center
        gap-2
        px-3
        py-2
        rounded-lg
        text-sm
        text-slate-600
        hover:bg-slate-100
    "
>
    <Reply size={15} />
    Reply
</button>
         
           <div className="flex items-center gap-1 px-2 py-2 border-b border-slate-100">

    {reactionEmojis.map((emoji) => (
        <button
            key={emoji}
            onClick={() => {

                handleReaction(
                    message._id,
                    emoji
                );

                setActiveMessage(null);

            }}
            className="
                h-7
                w-7
                rounded-lg
                hover:bg-slate-100
                transition
                text-base
            "
        >
            {emoji}
        </button>
    ))}

</div>

                        <button
                            onClick={() =>
                                handleCopyMessage(
                                    message.content
                                )
                            }
                            className="
                                w-full
                                flex
                                items-center
                                gap-2
                                px-3
                                py-2
                                rounded-lg
                                text-sm
                                text-slate-600
                                hover:bg-slate-100
                            "
                        >
                            <Copy size={15} />
                            Copy
                        </button>

                        {/*Message Forwarding*/}
                        <button
    type="button"
    onClick={() => {
        setForwardMessage(message);
        setForwardSearch("");
        setSelectedForwardChats([]);
        setActiveMessage(null);
    }}
    className="
        w-full
        flex
        items-center
        gap-3
        px-3
        py-2
        rounded-lg
        text-sm
        text-slate-700
        hover:bg-slate-100
    "
>
    <Forward size={16} />
    Forward
</button>


                        {/* EDIT */}

                        <button
                            onClick={() => {

                                setEditingMessage(message);

                                setEditText(
                                    message.content
                                );

                                setActiveMessage(null);

                            }}
                            className="
                                w-full
                                flex
                                items-center
                                gap-2
                                px-3
                                py-2
                                rounded-lg
                                text-sm
                                text-slate-600
                                hover:bg-slate-100
                            "
                        >
                            <Pencil size={15} />
                            Edit
                        </button>

                        {/* PIN */}

<button
    onClick={async () => {

        try {

            const response =
                await api.patch(
                    `/message/${message._id}/pin`
                );

            setMessages((previous) =>
                previous.map((msg) =>
                    msg._id === message._id
                        ? response.data
                        : msg
                )
            );

            setActiveMessage(null);

        } catch (error) {

            console.error(
                "Pin message error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to pin message"
            );
        }

    }}
    className="
        w-full
        flex
        items-center
        gap-2
        px-3
        py-2
        rounded-lg
        text-sm
        text-slate-600
        hover:bg-slate-100
    "
>
    <Pin size={15} />

    {message.pinned
        ? "Unpin"
        : "Pin message"}
</button>


                        {/* DELETE */}

                        <button
                            onClick={() => {

                                setActiveMessage(null);

                                handleDeleteMessage(
                                    message._id
                                );

                            }}
                            className="
                                w-full
                                flex
                                items-center
                                gap-2
                                px-3
                                py-2
                                rounded-lg
                                text-sm
                                text-red-500
                                hover:bg-red-50
                            "
                        >
                            <Trash2 size={15} />
                            Delete
                        </button>

                    </div>
                )}


                {/* =========================
                    MESSAGE BUBBLE
                    ========================= */}
                
                {message.messageType === "system" ? (
    <div className="w-full flex justify-center my-3">
        <div className="
            px-4 py-2
            rounded-full
            bg-slate-100
            text-slate-500
            text-xs
            font-medium
            text-center
        ">
            {message.content}
        </div>
    </div>
) : (
                    

                <div
                    className={`
                        rounded-2xl
                        px-4
                        py-2.5
                        shadow-sm
                        ${
                            isMine
                                ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-md"
                                : "bg-white text-slate-700 border border-slate-200 rounded-bl-md"
                        }
                    `}
                >

                    {/* MESSAGE CONTENT */}

                    {message.pinned && (
    <div className="
        flex
        items-center
        gap-1
        text-[10px]
        text-indigo-500
        font-semibold
        mb-1
    ">
        📌 Pinned
    </div>
)}

                    {message.fileUrl && (
    <div className="mt-2">

        {autoDownload ? (
            <img
                src={message.fileUrl}
                alt="Shared"
                className="
                    max-w-[280px]
                    max-h-[320px]
                    rounded-xl
                    object-cover
                    cursor-pointer
                "
                onClick={() =>
                    window.open(
                        message.fileUrl,
                        "_blank"
                    )
                }
            />
        ) : (
            <button
                type="button"
                onClick={() =>
                    window.open(
                        message.fileUrl,
                        "_blank"
                    )
                }
                className="
                    px-4
                    py-3
                    rounded-xl
                    bg-slate-800
                    text-white
                    hover:bg-slate-700
                    transition
                "
            >
                📷 View image
            </button>
        )}

    </div>
)}

                    {message.deleted ? (

                        <p className="italic text-slate-300 text-sm">
                            🚫 This message was deleted
                        </p>

                    ) : (

                        <div className="text-sm leading-6 break-words">

                            {message.replyTo && (
    <div
        className={`mb-2 rounded-lg px-3 py-2 border-l-4 ${
            isMine
                ? "bg-white/10 border-indigo-200"
                : "bg-slate-100 border-indigo-500"
        }`}
    >

        <p
            className={`text-[11px] font-bold ${
                isMine
                    ? "text-indigo-200"
                    : "text-indigo-600"
            }`}
        >
            {message.replyTo.sender?.name ||
                "User"}
        </p>

        <p
            className={`text-xs truncate ${
                isMine
                    ? "text-indigo-100"
                    : "text-slate-500"
            }`}
        >
            {message.replyTo.deleted
                ? "🚫 This message was deleted"
                : message.replyTo.content}
        </p>

    </div>
)}
           {renderMessageAttachment(
    message,
    isMine
)}

                            {message.messageType === "text" || !message.fileUrl
                                   ? highlightText(message.content)
                                   : null}

                            {message.edited && (
                                <span
                                    className={`
                                        ml-2
                                        text-[10px]
                                        ${
                                            isMine
                                                ? "text-indigo-200"
                                                : "text-slate-400"
                                        }
                                    `}
                                >
                                    edited
                                </span>
                            )}

                        </div>

                    )}


                    {/* =========================
                        TIME INSIDE BUBBLE
                    ========================= */}

                    <div
                        className={`
                            mt-0.5
                            flex
                            items-center
                            justify-end
                            gap-1
                            text-[10px]
                            ${
                                isMine
                                    ? "text-indigo-200"
                                    : "text-slate-400"
                            }
                        `}
                    >

                        <span>
                            {new Date(
                                message.createdAt
                            ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>

                        {/* READ RECEIPT PLACEHOLDER */}

                        {isMine && (
    <span
        className={
            message.readBy?.some(
                (id) =>
                    id?.toString() ===
                    otherUser?._id?.toString()
            )
                ? "text-blue-300 font-bold"
                : "text-indigo-200"
        }
    >
        ✓✓
    </span>
)}

                    </div>

                </div>

)}
                   {message.messageType !== "system" &&
    message.reactions?.length > 0 && (
    <div className="flex flex-wrap gap-1 mt-1">

        {Object.entries(
            message.reactions.reduce(
                (groups, reaction) => {

                    groups[reaction.emoji] =
                        (groups[reaction.emoji] || 0) + 1;

                    return groups;

                },
                {}
            )
        ).map(([emoji, count]) => (

            <button
                key={emoji}
                onClick={() =>
                    handleReaction(
                        message._id,
                        emoji
                    )
                }
                className="
                    px-2
                    py-0.5
                    rounded-full
                    bg-white
                    border
                    border-slate-200
                    text-xs
                    shadow-sm
                    hover:bg-slate-50
                "
            >
                {emoji}
                {count > 1 && (
                    <span className="ml-1">
                        {count}
                    </span>
                )}
            </button>

        ))}

    </div>
)}
            </div>

        </div>
    );
})}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="rounded-2xl bg-white border border-slate-200 px-3 py-2">
                  <span className="inline-flex gap-1">
                    <i className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <i className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                    <i className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
                {otherUser?.name || "Someone"} is typing
              </div>
            )}

             {replyingTo && (
    <div className="mx-4 mb-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 flex items-center gap-3">

        <div className="h-8 w-1 rounded-full bg-indigo-500" />

        <div className="flex-1 min-w-0">

            <p className="text-xs font-semibold text-indigo-600">
                Replying to {replyingTo.sender?.name || "User"}
            </p>

            <p className="text-xs text-slate-500 truncate mt-0.5">
                {replyingTo.content}
            </p>

        </div>

        <button
            onClick={() => setReplyingTo(null)}
            className="text-slate-400 hover:text-slate-700 text-lg"
        >
            ×
        </button>

    </div>
)}
      

            <div ref={bottomRef} />
          </div>
        )}
      </div>

    {canSendMessage ? (
      <MessageInput
    chatId={selectedChat._id}
    replyTo={replyingTo}
    editingMessage={editingMessage}

    onCancelEdit={() => {
        setEditingMessage(null);
        setEditText("");
    }}
    onEditMessage={async (
        messageId,
        newContent
    ) => {

        try {

            const response =
                await api.patch(
                    `/message/${messageId}`,
                    {
                        content: newContent
                    }
                );

            setMessages((previous) =>
                previous.map((message) =>
                    message._id === messageId
                        ? response.data
                        : message
                )
            );

            socket.emit(
                "messageEdited",
                response.data
            );

            setEditingMessage(null);
            setEditText("");

        } catch (error) {

            console.error(
                "Edit message error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to edit message"
            );
        }
    }}
    onMessageSent={(message) => {

        addMessageOnce(message);

        setReplyingTo(null);

    }}
    onPollCreated={(poll) => {
    setPolls((prev) => {

        if (
            prev.some(
                item => item._id === poll._id
            )
        ) {
            return prev;
        }

        return [
            ...prev,
            poll
        ];
    });
}}
/>
   ) : (

    <div className="
        shrink-0
        px-4
        py-4
        border-t
        border-slate-200
        bg-white
        text-center
    ">

        <div className="
            inline-flex
            items-center
            gap-2
            px-4
            py-2.5
            rounded-xl
            bg-slate-100
            text-slate-500
            text-sm
            font-medium
        ">
            👑
            Only admins can send messages
        </div>

    </div>

)}

    {showAnnouncement && (
    <div className="
        fixed
        inset-0
        z-[1000]
        bg-black/40
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
            bg-white
            shadow-2xl
            p-6
        ">

            <div className="
                flex
                items-center
                justify-between
                mb-5
            ">

                <div>
                    <h2 className="
                        text-lg
                        font-bold
                        text-slate-800
                    ">
                        📢 Group Announcement
                    </h2>

                    <p className="
                        text-xs
                        text-slate-400
                        mt-1
                    ">
                        Visible to everyone in this group
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setShowAnnouncement(false)
                    }
                    className="
                        h-9
                        w-9
                        rounded-xl
                        hover:bg-slate-100
                        text-slate-500
                    "
                >
                    ×
                </button>

            </div>

            <textarea
                value={announcementText}
                onChange={(e) =>
                    setAnnouncementText(
                        e.target.value
                    )
                }
                placeholder="Write an important announcement..."
                rows={5}
                maxLength={500}
                className="
                    w-full
                    resize-none
                    rounded-2xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-indigo-400
                    focus:ring-2
                    focus:ring-indigo-100
                "
            />

            <div className="
                flex
                justify-between
                items-center
                mt-2
            ">
                <span className="
                    text-xs
                    text-slate-400
                ">
                    {announcementText.length}/500
                </span>
            </div>

            <div className="
                flex
                gap-3
                mt-5
            ">

                <button
                    type="button"
                    onClick={() =>
                        setShowAnnouncement(false)
                    }
                    className="
                        flex-1
                        py-3
                        rounded-xl
                        bg-slate-100
                        text-slate-600
                        font-semibold
                        text-sm
                    "
                >
                    Cancel
                </button>

                <button
                    type="button"
                    disabled={savingAnnouncement}
                    onClick={handleCreateAnnouncement}
                    className="
                        flex-1
                        py-3
                        rounded-xl
                        bg-indigo-600
                        text-white
                        font-semibold
                        text-sm
                        disabled:opacity-50
                    "
                >
                    {savingAnnouncement
                        ? "Saving..."
                        : "Publish"}
                </button>

            </div>

        </div>

    </div>
)}

    </div>
  );
}

export default ChatWindow;
