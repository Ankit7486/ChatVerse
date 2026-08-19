import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Search,
    Users,
    X
} from "lucide-react";

import api from "../services/api";

function CreateGroup({
    user,
    onClose,
    onCreated
}) {

    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] =
        useState([]);

    const [groupName, setGroupName] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [loadingUsers, setLoadingUsers] =
        useState(true);


    useEffect(() => {

    const loadUsers = async () => {

        try {

            setLoadingUsers(true);

            const keyword = search.trim();

            const response = await api.get(
                `/users?search=${encodeURIComponent(keyword)}`
            );

            setUsers(
                Array.isArray(response.data)
                    ? response.data
                    : response.data?.users || []
            );

        } catch (error) {

            console.error(
                "Group user search error:",
                error
            );

            setUsers([]);

        } finally {

            setLoadingUsers(false);

        }

    };

    loadUsers();

}, [search]);


    const toggleUser = (userId) => {

        setSelectedUsers((previous) => {

            if (
                previous.includes(userId)
            ) {
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


    const createGroup = async () => {

        if (!groupName.trim()) {
            alert("Enter group name");
            return;
        }

        if (selectedUsers.length < 1) {
            alert(
                "Select at least one participant"
            );
            return;
        }

        try {

            setLoading(true);

            const response =
                await api.post(
                    "/chat/group",
                    {
                        name:
                            groupName.trim(),

                        participantIds:
                            selectedUsers
                    }
                );

            onCreated(response.data);

        } catch (error) {

            console.error(
                "Create group error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to create group"
            );

        } finally {

            setLoading(false);

        }
    };


    const filteredUsers =
        users.filter((user) =>
            user.name
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                )
        );


    return (
        <div className="
            fixed
            inset-0
            z-[200]
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
                max-h-[90vh]
                overflow-hidden
                rounded-3xl
                bg-slate-900
                border
                border-white/10
                shadow-2xl
                flex
                flex-col
            ">

                {/* HEADER */}

                <div className="
                    px-5
                    py-4
                    flex
                    items-center
                    gap-3
                    border-b
                    border-white/10
                ">

                    <button
                        onClick={onClose}
                        className="
                            h-9 w-9
                            rounded-full
                            flex
                            items-center
                            justify-center
                            hover:bg-white/10
                        "
                    >
                        <ArrowLeft size={19} />
                    </button>

                    <div className="
                        h-10 w-10
                        rounded-xl
                        bg-indigo-500/20
                        text-indigo-400
                        flex
                        items-center
                        justify-center
                    ">
                        <Users size={20} />
                    </div>

                    <div className="flex-1">

                        <h2 className="
                            font-semibold
                            text-white
                        ">
                            Create Group
                        </h2>

                        <p className="
                            text-xs
                            text-slate-400
                        ">
                            Add people to your group
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="
                            h-9 w-9
                            rounded-full
                            flex
                            items-center
                            justify-center
                            hover:bg-white/10
                        "
                    >
                        <X size={18} />
                    </button>

                </div>


                {/* BODY */}

                <div className="
                    p-5
                    overflow-y-auto
                ">

                    {/* GROUP NAME */}

                    <label className="
                        text-xs
                        font-semibold
                        text-slate-400
                    ">
                        Group name
                    </label>

                    <input
                        value={groupName}
                        onChange={(e) =>
                            setGroupName(
                                e.target.value
                            )
                        }
                        placeholder="e.g. College Friends"
                        maxLength={50}
                        className="
                            mt-2
                            w-full
                            px-4
                            py-3
                            rounded-xl
                            bg-white/5
                            border
                            border-white/10
                            text-white
                            outline-none
                            focus:border-indigo-500
                        "
                    />


                    {/* SEARCH */}

                    <div className="
                        mt-5
                        relative
                    ">

                        <Search
                            size={17}
                            className="
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                text-slate-500
                            "
                        />

                        <input
                            value={search}
                            onChange={(e) =>
                                setSearch(
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
                                bg-white/5
                                border
                                border-white/10
                                text-white
                                outline-none
                            "
                        />

                    </div>


                    {/* SELECTED */}

                    {selectedUsers.length > 0 && (
                        <div className="
                            mt-4
                            flex
                            flex-wrap
                            gap-2
                        ">

                            {selectedUsers.map(
                                (id) => {

                                    const user =
                                        users.find(
                                            u =>
                                                u._id === id
                                        );

                                    return (
                                        <div
                                            key={id}
                                            className="
                                                px-3
                                                py-1.5
                                                rounded-full
                                                bg-indigo-500/20
                                                text-indigo-300
                                                text-xs
                                                flex
                                                items-center
                                                gap-2
                                            "
                                        >
                                            {user?.name}

                                            <button
                                                onClick={() =>
                                                    toggleUser(
                                                        id
                                                    )
                                                }
                                            >
                                                <X size={13} />
                                            </button>

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}


                    {/* USERS */}

                    <div className="
                        mt-4
                        space-y-1
                    ">

                        {loadingUsers ? (

                            <p className="
                                text-center
                                py-8
                                text-slate-500
                            ">
                                Loading users...
                            </p>

                        ) : filteredUsers.length === 0 ? (

                            <p className="
                                text-center
                                py-8
                                text-slate-500
                            ">
                                No users found
                            </p>

                        ) : (

                            filteredUsers.map(
                                (user) => {

                                    const selected =
                                        selectedUsers.includes(
                                            user._id
                                        );

                                    return (
                                        <button
                                            key={user._id}
                                            onClick={() =>
                                                toggleUser(
                                                    user._id
                                                )
                                            }
                                            className="
                                                w-full
                                                p-3
                                                rounded-xl
                                                flex
                                                items-center
                                                gap-3
                                                text-left
                                                hover:bg-white/5
                                            "
                                        >

                                            <div className="
                                                h-10
                                                w-10
                                                rounded-full
                                                bg-indigo-500/20
                                                flex
                                                items-center
                                                justify-center
                                                text-indigo-300
                                                font-semibold
                                            ">
                                                {user.name
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="
                                                flex-1
                                            ">
                                                <p className="
                                                    text-sm
                                                    font-medium
                                                    text-white
                                                ">
                                                    {user.name}
                                                </p>

                                                <p className="
                                                    text-xs
                                                    text-slate-500
                                                ">
                                                    {user.email}
                                                </p>
                                            </div>

                                            <div className={`
                                                h-5
                                                w-5
                                                rounded-full
                                                border
                                                flex
                                                items-center
                                                justify-center
                                                ${
                                                    selected
                                                        ? "bg-indigo-600 border-indigo-600"
                                                        : "border-slate-600"
                                                }
                                            `}>
                                                {selected && (
                                                    <span className="
                                                        text-white
                                                        text-xs
                                                    ">
                                                        ✓
                                                    </span>
                                                )}
                                            </div>

                                        </button>
                                    );

                                }
                            )

                        )}

                    </div>

                </div>


                {/* FOOTER */}

                <div className="
                    p-4
                    border-t
                    border-white/10
                ">

                    <button
                        onClick={createGroup}
                        disabled={
                            loading ||
                            !groupName.trim() ||
                            selectedUsers.length < 1
                        }
                        className="
                            w-full
                            py-3
                            rounded-xl
                            bg-indigo-600
                            hover:bg-indigo-700
                            text-white
                            font-semibold
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                        "
                    >
                        {loading
                            ? "Creating..."
                            : `Create Group${
                                selectedUsers.length
                                    ? ` (${selectedUsers.length})`
                                    : ""
                              }`}
                    </button>

                </div>

            </div>

        </div>
    );
}

export default CreateGroup;