import {
    ArrowLeft,
    Bell,
    Moon,
    Shield,
    Trash2,
    LogOut,
    Volume2,
    Eye,
    MessageCircle,
    Palette,
    Download
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Settings() {

    const navigate = useNavigate();

    const [notifications, setNotifications] =
        useState(true);

    const [sound, setSound] =
        useState(true);

    const [showLastSeen, setShowLastSeen] =
        useState(true);

    const [enterToSend, setEnterToSend] =
        useState(true);

    const [darkMode, setDarkMode] =
        useState(true);

    const [showOnlineStatus, setShowOnlineStatus] =
    useState(true);

const [desktopNotifications, setDesktopNotifications] =
    useState(false);

const [autoDownload, setAutoDownload] =
    useState(true);

const [soundVolume, setSoundVolume] =
    useState(70);

    // =========================
    // LOAD SETTINGS
    // =========================

    useEffect(() => {

        const saved =
            localStorage.getItem("chatverseSettings");

        if (!saved) return;

        try {

            const settings =
                JSON.parse(saved);

            setNotifications(
                settings.notifications ?? true
            );

            setSound(
                settings.sound ?? true
            );

            setShowLastSeen(
                settings.showLastSeen ?? true
            );

            setEnterToSend(
                settings.enterToSend ?? true
            );

            setDarkMode(
                settings.darkMode ?? true
            );

            setShowOnlineStatus(
    settings.showOnlineStatus ?? true
);

setDesktopNotifications(
    settings.desktopNotifications ?? false
);

setAutoDownload(
    settings.autoDownload ?? true
);

setSoundVolume(
    settings.soundVolume ?? 70
);

        } catch (error) {

            console.error(
                "Settings load error:",
                error
            );

        }

    }, []);

    // =========================
    // SAVE SETTINGS
    // =========================


useEffect(() => {

    const settings = {
        notifications,
        sound,
        showLastSeen,
        enterToSend,
        autoDownload,
        darkMode
    };

    // Save
    localStorage.setItem(
        "chatverseSettings",
        JSON.stringify(settings)
    );

    // Apply dark mode
    document.documentElement.classList.toggle(
        "dark",
        darkMode
    );

    // Tell other components
    window.dispatchEvent(
        new CustomEvent(
            "chatverse-settings-changed",
            {
                detail: settings
            }
        )
    );

}, [
    notifications,
    sound,
    showLastSeen,
    enterToSend,
    autoDownload,
    darkMode,
]);

    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("token");

    navigate("/login", {
        replace: true
    });
};

    // =========================
    // DELETE ACCOUNT
    // =========================

    const handleDeleteAccount = async () => {

        const confirmed = window.confirm(
            "Delete your ChatVerse account permanently? This cannot be undone."
        );

        if (!confirmed) return;

        try {

            await api.delete("/profile");

            localStorage.removeItem("token");
            localStorage.removeItem(
                "chatverseSettings"
            );

            navigate("/login", {
                replace: true
            });

        } catch (error) {

            console.error(
                "Delete account error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to delete account."
            );

        }

    };

    return (

        <div
    className={`
        min-h-screen
         bg-gradient-to-br
    from-slate-50
    via-white
    to-indigo-50
    text-slate-800
        ${
            darkMode
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-900"
        }
    `}
>


                {/* =========================
                    HEADER
                ========================= */}
   
        <div className="
    relative
    mb-8
    overflow-hidden
    rounded-[2rem]
    bg-gradient-to-br
    from-indigo-600
    via-violet-600
    to-fuchsia-600
    p-6
    md:p-8
    shadow-2xl
    shadow-indigo-200
">

    {/* Decorative circles */}

    <div className="
        absolute
        -right-16
        -top-16
        h-40
        w-40
        rounded-full
        bg-white/10
        blur-sm
    " />

    <div className="
        absolute
        -bottom-20
        -left-10
        h-44
        w-44
        rounded-full
        bg-fuchsia-400/20
        blur-2xl
    " />


    {/* Back */}

    <button
        onClick={() => navigate("/home")}
        className="
            relative
            z-10
            flex
            items-center
            gap-2
            text-sm
            font-medium
            text-white/80
            hover:text-white
            transition
            mb-8
        "
    >
        <ArrowLeft size={18} />
        Back to ChatVerse
    </button>


    {/* Title */}

    <div className="
        relative
        z-10
        flex
        items-center
        gap-4
    ">

        <div className="
            h-16
            w-16
            shrink-0
            rounded-2xl
            bg-white/15
            backdrop-blur-md
            border
            border-white/20
            flex
            items-center
            justify-center
            text-3xl
            shadow-xl
        ">
            ⚙️
        </div>

        <div>

            <h1 className="
                text-3xl
                md:text-4xl
                font-black
                tracking-tight
                text-white
            ">
                Settings
            </h1>

            <p className="
                mt-1
                text-sm
                md:text-base
                text-white/70
            ">
                Make ChatVerse feel like yours.
            </p>

        </div>

    </div>



           {/* =========================
    ACCOUNT
========================= */}

<SettingsSection
    icon={<Shield size={19} />}
    title="Account"
    description="Manage your ChatVerse account"
>
    <button
        onClick={() => navigate("/profile")}
        className="
            w-full
            flex
            items-center
            gap-4
            px-4
            py-4
            rounded-2xl
            hover:bg-slate-50
            transition
            text-left
        "
    >

        <div className="
            h-10
            w-10
            rounded-xl
            bg-indigo-50
            text-indigo-600
            flex
            items-center
            justify-center
        ">
            👤
        </div>

        <div className="flex-1">

            <p className="
                font-semibold
                text-slate-800
            ">
                Profile
            </p>

            <p className="
                text-xs
                text-slate-400
            ">
                Name, email and profile photo
            </p>

        </div>

        <span className="text-slate-400 text-lg">
            →
        </span>

    </button>
</SettingsSection>

                {/* =========================
                    APPEARANCE
                ========================= */}

                <SettingsSection
                    icon={<Palette size={19} />}
                    title="Appearance"
                    description="Customize how ChatVerse looks"
                >

                    <SettingRow
                        icon={<Moon size={18} />}
                        title="Dark mode"
                        description="Use the dark ChatVerse interface"
                        checked={darkMode}
                        onChange={setDarkMode}
                    />

                </SettingsSection>


                {/* =========================
                    NOTIFICATIONS
                ========================= */}

                <SettingsSection
                    icon={<Bell size={19} />}
                    title="Notifications"
                    description="Control how ChatVerse notifies you"
                >

                    <SettingRow
                        icon={<Bell size={18} />}
                        title="Message notifications"
                        description="Get notified when someone messages you"
                        checked={notifications}
                        onChange={async (value) => {

    if (
        value &&
        "Notification" in window
    ) {

        const permission =
            await Notification.requestPermission();

        if (
            permission !== "granted"
        ) {

            alert(
                "Please allow notifications in your browser settings."
            );

            return;
        }
    }

    setNotifications(value);

}}
                    />

                    <SettingRow
                        icon={<Volume2 size={18} />}
                        title="Message sound"
                        description="Play a sound for new messages"
                        checked={sound}
                        onChange={setSound}
                    />

                    <div className="px-4 py-4">

    <div className="flex items-center justify-between">

        <div>

            <p className="font-medium">
                Sound volume
            </p>

            <p className="text-xs text-slate-500 mt-0.5">
                Adjust notification volume
            </p>

        </div>

        <span className="text-sm text-indigo-400">
            {soundVolume}%
        </span>

    </div>

    <input
        type="range"
        min="0"
        max="100"
        value={soundVolume}
        onChange={(e) =>
            setSoundVolume(
                Number(e.target.value)
            )
        }
        disabled={!sound}
        className="w-full mt-4 accent-indigo-600"
    />

</div>

                    <SettingRow
    icon={<Bell size={18} />}
    title="Desktop notifications"
    description="Show notifications for new messages"
    checked={desktopNotifications}
    onChange={setDesktopNotifications}
/>

                </SettingsSection>


                {/* =========================
                    CHAT
                ========================= */}

                <SettingsSection
                    icon={<MessageCircle size={19} />}
                    title="Chat"
                    description="Customize your messaging experience"
                >

                    <SettingRow
                        icon={<MessageCircle size={18} />}
                        title="Enter to send"
                        description="Press Enter to send messages"
                        checked={enterToSend}
                        onChange={setEnterToSend}
                    />

                    <SettingRow
    icon={<Download size={18} />}
    title="Auto-download media"
    description="Automatically load images and videos"
    checked={autoDownload}
    onChange={setAutoDownload}
/>

                </SettingsSection>


                {/* =========================
                    PRIVACY
                ========================= */}

                <SettingsSection
                    icon={<Shield size={19} />}
                    title="Privacy"
                    description="Control what other people can see"
                >

                    <SettingRow
                        icon={<Eye size={18} />}
                        title="Show last seen"
                        description="Allow people to see when you were last active"
                        checked={showLastSeen}
                        onChange={setShowLastSeen}
                    />

                    <SettingRow
    icon={<Eye size={18} />}
    title="Show online status"
    description="Allow people to see when you are online"
    checked={showOnlineStatus}
    onChange={setShowOnlineStatus}
/>

                </SettingsSection>


                {/* =========================
                    ACCOUNT
                ========================= */}

                <SettingsSection
                    icon={<Shield size={19} />}
                    title="Account"
                    description="Manage your ChatVerse account"
                >

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 transition text-left"
                    >

                        <LogOut
                            size={19}
                            className="text-slate-400"
                        />

                        <div>

                            <p className="font-medium">
                                Logout
                            </p>

                            <p className="text-xs text-slate-500">
                                Sign out of this device
                            </p>

                        </div>

                    </button>


                    <SettingsSection
    icon={<Trash2 size={19} />}
    title="Danger Zone"
    description="Irreversible account actions"
>
    <button
        onClick={handleDeleteAccount}
        className="
            w-full
            flex
            items-center
            gap-4
            px-4
            py-4
            text-left
            rounded-2xl
            hover:bg-red-50
            transition
        "
    >

        <div className="
            h-10
            w-10
            rounded-xl
            bg-red-50
            text-red-500
            flex
            items-center
            justify-center
        ">
            <Trash2 size={18} />
        </div>

        <div className="flex-1">

            <p className="
                font-semibold
                text-red-600
            ">
                Delete account
            </p>

            <p className="
                text-xs
                text-red-400
            ">
                Permanently delete your ChatVerse account
            </p>

        </div>

        <span className="
            text-red-400
            text-lg
        ">
            →
        </span>

    </button>
</SettingsSection>

                </SettingsSection>


                {/* =========================
                    VERSION
                ========================= */}

                <p className="text-center text-xs text-slate-700 mt-8">
                    ChatVerse • v1.0.0
                </p>

            </div>

        </div>
    
    );
}


/* =========================================
   SETTINGS SECTION
========================================= */

function SettingsSection({
    icon,
    title,
    description,
    children
}) {
    return (
        <section className="
            mb-6
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            shadow-sm
            shadow-slate-200/50
            transition
            hover:shadow-md
        ">

            {/* SECTION HEADER */}

            <div className="
                flex
                items-center
                gap-4
                px-5
                py-5
                bg-gradient-to-r
                from-slate-50
                to-white
            ">

                <div className="
                    h-11
                    w-11
                    shrink-0
                    rounded-2xl
                    bg-gradient-to-br
                    from-indigo-500
                    to-violet-600
                    text-white
                    flex
                    items-center
                    justify-center
                    shadow-lg
                    shadow-indigo-200
                ">
                    {icon}
                </div>

                <div className="min-w-0">

                    <h2 className="
                        text-base
                        font-bold
                        text-slate-800
                    ">
                        {title}
                    </h2>

                    <p className="
                        mt-0.5
                        text-xs
                        text-slate-500
                    ">
                        {description}
                    </p>

                </div>

            </div>


            {/* CONTENT */}

            <div className="
                border-t
                border-slate-100
                divide-y
                divide-slate-100
            ">
                {children}
            </div>

        </section>
    );
}


/* =========================================
   SETTING ROW
========================================= */

function SettingRow({
    icon,
    title,
    description,
    checked,
    onChange
}) {
    return (
        <div className="
            flex
            items-center
            gap-4
            px-5
            py-4
            bg-white
            hover:bg-slate-50
            transition
        ">

            {/* ICON */}

            <div className="
                h-10
                w-10
                shrink-0
                rounded-xl
                bg-indigo-50
                text-indigo-600
                flex
                items-center
                justify-center
            ">
                {icon}
            </div>


            {/* TEXT */}

            <div className="
                flex-1
                min-w-0
            ">

                <p className="
                    text-sm
                    font-semibold
                    text-slate-800
                ">
                    {title}
                </p>

                <p className="
                    mt-0.5
                    text-xs
                    text-slate-500
                    leading-5
                ">
                    {description}
                </p>

            </div>


            {/* TOGGLE */}

            <button
                type="button"
                aria-pressed={checked}
                onClick={() => onChange(!checked)}
                className={`
                    relative
                    h-7
                    w-12
                    shrink-0
                    rounded-full
                    p-1
                    transition-all
                    duration-200
                    focus:outline-none
                    focus:ring-2
                    focus:ring-indigo-300
                    ${
                        checked
                            ? "bg-indigo-600"
                            : "bg-slate-300"
                    }
                `}
            >

                <span
                    className={`
                        block
                        h-5
                        w-5
                        rounded-full
                        bg-white
                        shadow-md
                        transition-transform
                        duration-200
                        ${
                            checked
                                ? "translate-x-5"
                                : "translate-x-0"
                        }
                    `}
                />

            </button>

        </div>
    );
}

export default Settings;