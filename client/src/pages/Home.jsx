import { useEffect, useState, useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import api from "../services/api";
import socket, { connectSocket } from "../services/socket";
import AuthContext from "../context/AuthContext";

function Home() {

    const { user, setUser } = useContext(AuthContext);
    const [selectedChat, setSelectedChat] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [chats, setChats] = useState([]);


    useEffect(() => {
        const fetchProfile = async () => {

        try {

            const response = await api.get("/profile");

            setUser(response.data.user);

        } catch (error) {

            console.error("Profile error:", error);

            if (error.response?.status === 401) {

                localStorage.removeItem("token");

                window.location.href = "/login";

            }
        }
    };
      fetchProfile();
    }, []);


   useEffect(() => {

    if (!user?._id) return;

    connectSocket();

    const handleOnlineUsers = (users) => {

        setOnlineUsers(users);

    };

    socket.on(
        "onlineUsers",
        handleOnlineUsers
    );

    return () => {

        socket.off(
            "onlineUsers",
            handleOnlineUsers
        );

    };

}, [user]);
    
    return (
       <div className="h-screen w-full overflow-hidden flex">

    {/* SIDEBAR */}

    <div
        className={`
            w-full
            md:w-[360px]
            md:block
            shrink-0
            ${selectedChat ? "hidden md:block" : "block"}
        `}
    >
        <Sidebar
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            user={user}
            onlineUsers={onlineUsers}
        />
    </div>


    {/* CHAT */}

    <div
        className={`
            flex-1
            min-w-0
            ${selectedChat ? "block" : "hidden md:block"}
        `}
    >
        <ChatWindow
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            currentUser={user}
            onlineUsers={onlineUsers}
            onBack={() => setSelectedChat(null)}
        />
    </div>

</div>
    );
};

export default Home;