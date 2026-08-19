import { useEffect, useState } from "react";
import { Camera, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Profile({ user, setUser }) {

    const navigate = useNavigate();

    const [name, setName] = useState(user?.name || "");
    const [about, setAbout] = useState(
        user?.about || "Hey! I am using ChatVerse."
    );

    const [avatar, setAvatar] = useState(
        user?.avatar || ""
    );

    const [saving, setSaving] = useState(false);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);

    useEffect(() => {
        setName(user?.name || "");
        setAbout(
            user?.about || "Hey! I am using ChatVerse."
        );
        setAvatar(user?.avatar || "");
    }, [user]);

    const handleSave = async () => {

        try {

            setSaving(true);

            const response = await api.put("/profile", {
                name,
                about,
                avatar
            });

            setUser(response.data.user);

            alert("Profile updated successfully!");

        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to update profile"
            );

        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (e) => {

    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {

        alert("Image must be smaller than 5MB");

        return;
    }

     // Image preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatar(previewUrl);


    try {

        const formData = new FormData();

        formData.append("avatar", file);

        const response = await api.post(
            "/profile/avatar",
            formData
        );

        const updatedUser = {
            ...user,
            avatar: response.data.avatar
        };

        setUser(updatedUser);

        setAvatar(response.data.avatar);
        URL.revokeObjectURL(previewUrl);

    } catch (error) {

        console.error(
            "Avatar upload failed:",
            error
        );

         // Restore previous avatar if upload fails
        setAvatar(user?.avatar || "");

        alert(
            error.response?.data?.message ||
            "Failed to upload profile picture"
        );

    }

};

const handleRemoveAvatar = async () => {
    try {
        const confirmed = window.confirm(
            "Remove your profile picture?"
        );

        if (!confirmed) return;

        await api.delete("/profile/avatar");
        setAvatar("");
        setUser({
            ...user,
            avatar: "",
            avatarPublicId: ""
        });

        setShowAvatarMenu(false);

    } catch (error) {
        console.error(
            "Remove avatar error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to remove profile picture"
        );
    }
};

    return (
        <div className="min-h-full bg-slate-950 text-white p-6">

            <div className="max-w-2xl mx-auto">

                {/* Header */}

                <div className="flex items-center gap-3 mb-8">

                    <button
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 rounded-xl
                        bg-white/5 hover:bg-white/10
                        grid place-items-center"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <h1 className="text-2xl font-black">
                            My Profile
                        </h1>

                        <p className="text-sm text-slate-400">
                            Customize your ChatVerse profile
                        </p>
                    </div>

                </div>

                {/* Profile Card */}

                <div className="rounded-3xl
                    bg-white/5
                    border border-white/10
                    p-8">

                    {/* Avatar */}

                    <div className="flex flex-col items-center">

                       <div className="relative">

    {/* PROFILE IMAGE */}
    <div className="
        h-32 w-32
        rounded-full
        overflow-hidden
        bg-gradient-to-br
        from-indigo-500
        to-violet-600
        flex items-center
        justify-center
        text-5xl
        font-black
    ">

        {avatar ? (
            <img
                src={avatar}
                alt={name || "Profile"}
                className="w-full h-full object-cover"
            />
        ) : (
            name?.charAt(0)?.toUpperCase() || "?"
        )}

    </div>


    {/* CAMERA BUTTON */}
    <button
        type="button"
        onClick={() =>
            setShowAvatarMenu(
                previous => !previous
            )
        }
        className="
            absolute
            bottom-1
            right-1
            h-10
            w-10
            rounded-full
            bg-indigo-600
            hover:bg-indigo-500
            grid
            place-items-center
            shadow-xl
            transition
        "
        title="Profile picture options"
    >
        <Camera size={18} />
    </button>


    {/* CAMERA OPTIONS */}
    {showAvatarMenu && (
        <div
            className="
                absolute
                top-full
                right-0
                mt-3
                z-50
                w-48
                rounded-2xl
                border
                border-white/10
                bg-slate-900
                shadow-2xl
                overflow-hidden
            "
        >

            {/* CHANGE PHOTO */}
            <label
                htmlFor="avatarInput"
                className="
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    text-sm
                    text-white
                    hover:bg-white/10
                    cursor-pointer
                "
            >
                <Camera size={17} />

                <span>
                    Change photo
                </span>
            </label>


            {/* REMOVE PHOTO */}
            {avatar && (
                <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                        text-sm
                        text-red-400
                        hover:bg-red-500/10
                    "
                >
                    <span>🗑️</span>

                    <span>
                        Remove photo
                    </span>
                </button>
            )}

        </div>
    )}


    {/* ACTUAL FILE INPUT */}
    <input
        id="avatarInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
            setShowAvatarMenu(false);
            handleAvatarChange(e);
        }}
    />

</div>

                        <p className="mt-4 font-bold text-lg">
                            {name || "Your Name"}
                        </p>

                        <p className="text-sm text-slate-400">
                            {user?.email}
                        </p>

                    </div>

                    {/* Name */}

                    <div className="mt-8">

                        <label className="text-sm font-semibold">
                            Name
                        </label>

                        <input
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            className="
                                mt-2 w-full
                                rounded-2xl
                                bg-black/20
                                border border-white/10
                                px-4 py-3
                                outline-none
                                focus:border-indigo-500
                            "
                            placeholder="Your name"
                        />

                    </div>

                    {/* About */}

                    <div className="mt-5">

                        <label className="text-sm font-semibold">
                            About
                        </label>

                        <textarea
                            value={about}
                            onChange={(e) =>
                                setAbout(e.target.value)
                            }
                            maxLength={120}
                            rows={3}
                            className="
                                mt-2 w-full
                                rounded-2xl
                                bg-black/20
                                border border-white/10
                                px-4 py-3
                                outline-none
                                resize-none
                                focus:border-indigo-500
                            "
                            placeholder="Tell people something about you..."
                        />

                        <p className="text-xs text-slate-500 mt-1 text-right">
                            {about.length}/120
                        </p>

                    </div>

                    {/* Avatar URL - temporary */}

                    <div className="mt-5">

                        <input
                      id="avatarInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
         />

                    </div>

                    {/* Save */}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="
                            mt-8
                            w-full
                            py-3.5
                            rounded-2xl
                            bg-gradient-to-r
                            from-indigo-600
                            to-violet-600
                            hover:from-indigo-500
                            hover:to-violet-500
                            font-bold
                            flex items-center
                            justify-center
                            gap-2
                            disabled:opacity-50
                        "
                    >

                        <Save size={18} />

                        {saving
                            ? "Saving..."
                            : "Save Changes"
                        }

                    </button>

                </div>

            </div>

        </div>
    );
}

export default Profile;