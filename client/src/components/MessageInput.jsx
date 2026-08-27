import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Image, FileText, Video, X, Pencil, Mic, Square, Sparkles, Loader2, Globe, BarChart3 } from "lucide-react";
import api from "../services/api";
import socket from "../services/socket";

function MessageInput({ chatId, onMessageSent, replyTo, onPollCreated, onEditMessage, editingMessage, onCancelEdit }) {

    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showPollModal, setShowPollModal] =
    useState(false);

const [pollQuestion, setPollQuestion] =
    useState("");

const [pollOptions, setPollOptions] =
    useState(["", ""]);

const [pollMultipleAnswers, setPollMultipleAnswers] =
    useState(false);

const [creatingPoll, setCreatingPoll] =
    useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [enterToSend, setEnterToSend] = useState(true);
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [aiListening, setAiListening] = useState(false);
    const [aiTranscript, setAiTranscript] = useState("");
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiLanguageStep, setAiLanguageStep] = useState(false);
    const [aiTargetLanguage, setAiTargetLanguage] = useState("");
    const [showLanguageList, setShowLanguageList] = useState(false);
    const [aiTranslatedText, setAiTranslatedText] = useState("");



    const [aiWakeListening, setAiWakeListening] =
    useState(false);

const [aiWaitingForConfirmation, setAiWaitingForConfirmation] =
    useState(false);
    const [aiPreviewMessage, setAiPreviewMessage] =
    useState("");

const [showAISendConfirmation, setShowAISendConfirmation] =
    useState(false);

const [aiTranslatedLanguage, setAiTranslatedLanguage] =
    useState("");
    const languages = [
    "English",
    "Hindi",
    "Bengali",
    "Tamil",
    "Telugu",
    "Marathi",
    "Gujarati",
    "Punjabi",
    "French",
    "German",
    "Spanish",
    "Japanese"
];

    const speechRecognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const typingTimeout = useRef(null);

    const handleSend = async (e) => {

        e.preventDefault();

        if (editingMessage) {

    if (!content.trim()) {
        return;
    }

    await onEditMessage(
        editingMessage._id,
        content.trim()
    );

    setContent("");

    return;
}

        if (!content.trim() || !chatId || sending) {
            return;
        }

        try {

            setSending(true);

            const response = await api.post("/message", {
                content: content.trim(),
                chatId,
                replyTo: replyTo?._id || null
            });

            onMessageSent(response.data);

            setContent("");

        } catch (error) {

            console.error("Error sending message:", error);

        } finally {

            setSending(false);

        }
    };

    const handleTyping = (e) => {

    setContent(e.target.value);

    if (!chatId) return;

    socket.emit("typing", chatId);

    if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {

        socket.emit("stopTyping", chatId);

    }, 1000);
   };

   const selectFile = (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert("File must be smaller than 10MB");
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("This file type is not supported.");
        return;
    }

    setSelectedFile(file);
    setShowAttachMenu(false);
};

   const handleFileSelect = (e) => {

    const file = e.target.files?.[0];

    if (!file) return;

    selectFile(file);

    e.target.value = "";
};

     const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
};

const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
};

const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
        selectFile(file);
    }
};

   const handleFileUpload = async () => {

    if (!selectedFile || !chatId) {
        return;
    }

    try {

        setUploading(true);

        const formData = new FormData();

        formData.append(
            "file",
            selectedFile
        );

        formData.append(
            "chatId",
            chatId
        );

        const response = await api.post(
            "/message/upload",
            formData
        );

        onMessageSent?.(
            response.data
        );

        setSelectedFile(null);

    } catch (error) {

        console.error(
            "File upload error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to upload file"
        );

    } finally {

        setUploading(false);
    }
};


const removePollOption = (index) => {

    if (pollOptions.length <= 2) {
        return;
    }

    setPollOptions(
        pollOptions.filter(
            (_, optionIndex) =>
                optionIndex !== index
        )
    );
};

const updatePollOption = (
    index,
    value
) => {

    setPollOptions(
        pollOptions.map(
            (option, optionIndex) =>
                optionIndex === index
                    ? value
                    : option
        )
    );
};

   // =========================
// AI SPEECH RECOGNITION
// =========================



const speakAI = (text) => {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang = "en-IN";

    utterance.rate = 1;

    utterance.pitch = 1;

    window.speechSynthesis.speak(
        utterance
    );
};

const startAIAssistant = () => {

    setAiTranscript("");
    setAiTranslatedText("");
    setAiTargetLanguage("");
    setShowLanguageList(false);
    setShowAISendConfirmation(false);
    setAiProcessing(false);

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert(
            "Speech recognition is not supported in this browser."
        );
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    speechRecognitionRef.current = recognition;

    setShowAIAssistant(true);
    setAiListening(true);
    setAiTranscript("");
    setAiLanguageStep(false);

    recognition.onresult = (event) => {
        const transcript =
            event.results[0][0].transcript;

        setAiTranscript(transcript);
        setAiListening(false);
        setAiLanguageStep(true);
    };

    recognition.onerror = (event) => {
        console.error(
            "Speech recognition error:",
            event.error
        );

        setAiListening(false);

        if (event.error === "not-allowed") {
            alert(
                "Please allow microphone permission."
            );
        }
    };

    recognition.onend = () => {
        setAiListening(false);
    };

    recognition.start();
};


   const closeAIAssistant = () => {
    if (speechRecognitionRef.current) {
        try {
            speechRecognitionRef.current.stop();
        } catch (error) {
            console.error(error);
        }
    }

    setShowAIAssistant(false);
    setAiListening(false);
    setAiTranscript("");
    setAiLanguageStep(false);
    setAiProcessing(false);
    setShowLanguageList(false);
    setAiTranslatedText("");
    setShowAISendConfirmation(false);
    setAiTargetLanguage("");

   
};

   const sendAIAssistantMessage = async (message) => {
    if (!message?.trim() || !chatId) {
        return;
    }

    try {
        setAiProcessing(true);

        const response = await api.post(
            "/message",
            {
                content: message.trim(),
                chatId,
                replyTo: replyTo?._id || null
            }
        );

        onMessageSent(response.data);

        closeAIAssistant();

    } catch (error) {

        console.error(
            "AI assistant send error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to send message"
        );

    } finally {
        setAiProcessing(false);
    }
};

const askForAISendConfirmation = (
    message,
    language
) => {

    setAiPreviewMessage(message);

    setAiTranslatedLanguage(
        language
    );

    setShowAISendConfirmation(true);

    setAiWaitingForConfirmation(true);

    setAiProcessing(false);

    // IMPORTANT:
    // Ask first. DO NOT say "Sending".
    speakAI(
        "Should I send this message?"
    );

    setTimeout(() => {
        startConfirmationListener();
    }, 1500);
};

  const confirmAISend = async () => {

    if (!aiPreviewMessage?.trim()) {
        return;
    }

    setAiWaitingForConfirmation(false);

    speakAI("Sending message.");

    await sendAIAssistantMessage(
        aiPreviewMessage
    );
};

const cancelAISend = () => {

    setAiWaitingForConfirmation(false);

    setShowAISendConfirmation(false);

    setAiPreviewMessage("");

    setAiTranslatedLanguage("");

    setAiProcessing(false);

    speakAI(
        "Okay, I won't send it."
    );

};

const startConfirmationListener = () => {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        return;
    }

    const recognition =
        new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {

        const answer =
            event.results[0][0]
                .transcript
                .trim()
                .toLowerCase();

        console.log(
            "AI confirmation:",
            answer
        );

        if (
            answer.includes("yes") ||
            answer.includes("yeah") ||
            answer.includes("okay") ||
            answer.includes("ok") ||
            answer.includes("send it") ||
            answer.includes("sure")
        ) {

            confirmAISend();

            return;
        }

        if (
            answer.includes("no") ||
            answer.includes("cancel") ||
            answer.includes("don't send") ||
            answer.includes("do not send")
        ) {

            cancelAISend();

            return;
        }

        speakAI(
            "Please say yes or no."
        );

        setTimeout(() => {
            startConfirmationListener();
        }, 1500);
    };

    recognition.onerror = (event) => {

        console.error(
            "Confirmation voice error:",
            event.error
        );
    };

    try {
        recognition.start();
    } catch (error) {
        console.error(error);
    }
};

  const translateAIMessage = async (targetLanguage) => {

    if (!aiTranscript.trim()) {
        return;
    }

    try {

        setAiProcessing(true);

        const response = await api.post(
            "/ai/translate",
            {
                text: aiTranscript.trim(),
                targetLanguage: targetLanguage
            }
        );

        const translatedText =
            response.data.translatedText;

        if (!translatedText?.trim()) {
            throw new Error(
                "AI returned an empty translation"
            );
        }

        setAiPreviewMessage(
            translatedText.trim()
        );

        setAiTranslatedLanguage(
            targetLanguage
        );

        setShowAISendConfirmation(true);

        setShowLanguageList(false);

    } catch (error) {

        console.error(
            "AI translation error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Translation failed"
        );

    } finally {

        setAiProcessing(false);

    }
};
 
   const handleLanguageSelect = async (language) => {
    setAiTargetLanguage(language);
    setShowLanguageList(false);

    await translateAIMessage(language);
};

   {/* =========================
    AI ASSISTANT
   ========================= */}


   const startRecording = async () => {
    if (!chatId || isRecording) return;

    try {
        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        const recorder =
            new MediaRecorder(stream);

        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(
                    event.data
                );
            }
        };

        recorder.onstop = async () => {

            stream
                .getTracks()
                .forEach((track) =>
                    track.stop()
                );

            const audioBlob = new Blob(
                audioChunksRef.current,
                {
                    type:
                        recorder.mimeType ||
                        "audio/webm"
                }
            );

            await uploadVoiceMessage(
                audioBlob
            );
        };

        recorder.start();

        setIsRecording(true);
        setRecordingTime(0);

        recordingTimerRef.current =
            setInterval(() => {
                setRecordingTime(
                    (previous) =>
                        previous + 1
                );
            }, 1000);

    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );

        alert(
            "Microphone permission is required to record voice messages."
        );
    }
};

   const stopRecording = () => {

    if (!mediaRecorderRef.current) {
        return;
    }

    mediaRecorderRef.current.stop();

    mediaRecorderRef.current = null;

    setIsRecording(false);

    clearInterval(
        recordingTimerRef.current
    );

    setRecordingTime(0);
};

   const uploadVoiceMessage = async (
    audioBlob
) => {

    try {

        setUploading(true);

        const formData = new FormData();

        const audioFile = new File(
            [audioBlob],
            `voice-${Date.now()}.webm`,
            {
                type:
                    audioBlob.type ||
                    "audio/webm"
            }
        );

        formData.append(
            "file",
            audioFile
        );

        formData.append(
            "chatId",
            chatId
        );

        formData.append(
            "messageType",
            "audio"
        );

        const response = await api.post(
            "/message/upload",
            formData
        );

        onMessageSent?.(
            response.data
        );

    } catch (error) {

        console.error(
            "Voice upload error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to send voice message"
        );

    } finally {

        setUploading(false);
    }
};

   useEffect(() => {

    if (editingMessage) {
        setContent(
            editingMessage.content || ""
        );
    }

}, [editingMessage]);

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

            setEnterToSend(
                settings.enterToSend ?? true
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

    const handlePaste = (event) => {

        const items = event.clipboardData?.items;

        if (!items) return;

        for (const item of items) {

            if (
                item.kind === "file" &&
                item.type.startsWith("image/")
            ) {

                const file = item.getAsFile();

                if (file) {
                    selectFile(file);
                }

                break;
            }
        }
    };

    window.addEventListener(
        "paste",
        handlePaste
    );

    return () => {
        window.removeEventListener(
            "paste",
            handlePaste
        );
    };

}, []);

    const addPollOption = () => {

    if (pollOptions.length >= 6) {
        return;
    }

    setPollOptions([
        ...pollOptions,
        ""
    ]);
};

const createPoll = async () => {

    const question =
        pollQuestion.trim();

    const options =
        pollOptions
            .map(option => option.trim())
            .filter(Boolean);

    if (!question) {
        alert("Enter a poll question");
        return;
    }

    if (options.length < 2) {
        alert(
            "Add at least 2 options"
        );
        return;
    }

    try {

        setCreatingPoll(true);

        const response =
            await api.post(
                "/poll",
                {
                    chatId,
                    question,
                    options,
                    multipleAnswers:
                        pollMultipleAnswers
                }
            );

            if (onPollCreated) {
    onPollCreated(response.data);
}

        // We'll connect this to the
        // chat message/socket in the next step.

        console.log(
            "Poll created:",
            response.data
        );

        setPollQuestion("");

        setPollOptions([
            "",
            ""
        ]);

        setPollMultipleAnswers(
            false
        );

        setShowPollModal(false);

    } catch (error) {

        console.error(
            "Poll creation error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to create poll"
        );

    } finally {

        setCreatingPoll(false);

    }
};

    return (

        <form
    onSubmit={handleSend}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    className={`
        relative
        bg-white
        border-t
        p-4
        transition
        ${
            isDragging
                ? "bg-indigo-50 ring-2 ring-inset ring-indigo-500"
                : ""
        }
    `}
    
>
    {isDragging && (
    <div className="
        absolute
        inset-2
        z-50
        rounded-2xl
        border-2
        border-dashed
        border-indigo-500
        bg-indigo-50/95
        flex
        flex-col
        items-center
        justify-center
        pointer-events-none
    ">

        <Image
            size={40}
            className="text-indigo-600 mb-2"
        />

        <p className="
            text-indigo-700
            font-bold
        ">
            Drop your file here
        </p>

        <p className="
            text-indigo-500
            text-xs
            mt-1
        ">
            Images, videos and documents up to 10MB
        </p>

    </div>
)}

    {/* =========================
        SELECTED FILE PREVIEW
       ========================= */}

    {selectedFile && (
        <div className="
            mb-3
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3
        ">

            {/* File icon */}

           <div className="
    h-14
    w-14
    shrink-0
    rounded-xl
    overflow-hidden
    bg-slate-100
    grid
    place-items-center
">

    {selectedFile.type.startsWith("image/") ? (
        <img
            src={URL.createObjectURL(selectedFile)}
            alt="Preview"
            className="
                w-full
                h-full
                object-cover
            "
        />
    ) : selectedFile.type.startsWith("video/") ? (
        <Video
            size={20}
            className="text-violet-600"
        />
    ) : (
        <FileText
            size={20}
            className="text-orange-600"
        />
    )}

</div>


            {/* File information */}

            <div className="min-w-0 flex-1">

                <p className="
                    text-sm
                    font-semibold
                    text-slate-700
                    truncate
                ">
                    {selectedFile.name}
                </p>

                <p className="
                    text-xs
                    text-slate-400
                ">
                    {(
                        selectedFile.size /
                        (1024 * 1024)
                    ).toFixed(2)} MB
                </p>

            </div>


            {/* Cancel */}

            <button
                type="button"
                onClick={() =>
                    setSelectedFile(null)
                }
                disabled={uploading}
                className="
                    h-9
                    w-9
                    rounded-xl
                    text-slate-400
                    hover:bg-slate-200
                    hover:text-slate-700
                    grid
                    place-items-center
                "
            >
                <X size={17} />
            </button>


            {/* Upload */}

            <button
                type="button"
                onClick={handleFileUpload}
                disabled={uploading}
                className="
                    px-4
                    py-2
                    rounded-xl
                    bg-indigo-600
                    hover:bg-indigo-700
                    text-white
                    text-sm
                    font-bold
                    disabled:opacity-50
                    transition
                "
            >
                {uploading
                    ? "Uploading..."
                    : "Send"}
            </button>

        </div>
    )}

    {showAIAssistant && (
    <div className="
        fixed
        inset-0
        z-[100]
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

            {/* HEADER */}

            <div className="
                flex
                items-center
                justify-between
                mb-6
            ">

                <div className="
                    flex
                    items-center
                    gap-3
                ">

                    <div className="
                        h-11
                        w-11
                        rounded-2xl
                        bg-indigo-100
                        text-indigo-600
                        flex
                        items-center
                        justify-center
                    ">
                        <Sparkles size={22} />
                    </div>

                    <div>
                        <h2 className="
                            font-bold
                            text-slate-800
                        ">
                            ChatVerse AI
                        </h2>

                        <p className="
                            text-xs
                            text-slate-400
                        ">
                            Voice Assistant
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    onClick={closeAIAssistant}
                    className="
                        h-9
                        w-9
                        rounded-full
                        hover:bg-slate-100
                        text-slate-500
                        flex
                        items-center
                        justify-center
                    "
                >
                    <X size={18} />
                </button>

            </div>


            {/* LISTENING */}

            {aiListening && (
                <div className="
                    text-center
                    py-8
                ">

                    <div className="
                        mx-auto
                        h-20
                        w-20
                        rounded-full
                        bg-indigo-100
                        text-indigo-600
                        flex
                        items-center
                        justify-center
                        animate-pulse
                    ">
                        <Mic size={32} />
                    </div>

                    <h3 className="
                        mt-5
                        font-semibold
                        text-slate-800
                    ">
                        Listening...
                    </h3>

                    <p className="
                        mt-1
                        text-sm
                        text-slate-400
                    ">
                        Speak your message
                    </p>

                </div>
            )}


            {/* TRANSCRIPT */}

            {!aiListening && aiTranscript && (
                <div>

                    <p className="
                        text-xs
                        font-semibold
                        text-slate-400
                        mb-2
                    ">
                        I heard:
                    </p>

                    <div className="
                        rounded-2xl
                        bg-slate-100
                        p-4
                        text-sm
                        text-slate-700
                        mb-6
                    ">
                        {aiTranscript}
                    </div>


                    {!showLanguageList && !showAISendConfirmation && (
                        <>
                            <p className="
                                text-sm
                                font-semibold
                                text-slate-700
                                mb-3
                            ">
                                How would you like to send it?
                            </p>


                            {/* ORIGINAL */}

                            <button
                                type="button"
                                disabled={aiProcessing}
                               onClick={() =>
                                  askForAISendConfirmation(
                                  aiTranscript,
                                  "Original" 
                                )
                              }
                                className="
                                    w-full
                                    flex
                                    items-center
                                    gap-3
                                    p-3
                                    rounded-xl
                                    border
                                    border-slate-200
                                    hover:bg-slate-50
                                    text-left
                                    transition
                                "
                            >
                                <span className="text-xl">
                                    🗣️
                                </span>

                                <div>
                                    <p className="
                                        font-semibold
                                        text-sm
                                    ">
                                        Original
                                    </p>

                                    <p className="
                                        text-xs
                                        text-slate-400
                                    ">
                                        Send exactly what I said
                                    </p>
                                </div>
                            </button>


                            {/* ENGLISH */}

                            <button
                                type="button"
                                disabled={aiProcessing}
                                onClick={() =>
                                    translateAIMessage(
                                        "English"
                                    )
                                }
                                className="
                                    w-full
                                    flex
                                    items-center
                                    gap-3
                                    p-3
                                    rounded-xl
                                    border
                                    border-slate-200
                                    hover:bg-slate-50
                                    text-left
                                    transition
                                    mt-2
                                "
                            >
                                <span className="text-xl">
                                    🇬🇧
                                </span>

                                <div>
                                    <p className="
                                        font-semibold
                                        text-sm
                                    ">
                                        English
                                    </p>

                                    <p className="
                                        text-xs
                                        text-slate-400
                                    ">
                                        Translate before sending
                                    </p>
                                </div>
                            </button>


                            {/* OTHER */}

                            <button
                                type="button"
                                disabled={aiProcessing}
                                onClick={() =>
                                    setShowLanguageList(true)
                                }
                                className="
                                    w-full
                                    flex
                                    items-center
                                    gap-3
                                    p-3
                                    rounded-xl
                                    border
                                    border-slate-200
                                    hover:bg-slate-50
                                    text-left
                                    transition
                                    mt-2
                                "
                            >
                                <Globe size={20} />

                                <div>
                                    <p className="
                                        font-semibold
                                        text-sm
                                    ">
                                        Other language
                                    </p>

                                    <p className="
                                        text-xs
                                        text-slate-400
                                    ">
                                        Choose another language
                                    </p>
                                </div>
                            </button>

                        </>
                    )}


                    {/* LANGUAGE LIST */}

                    {showLanguageList && (
                        <div>

                            <p className="
                                text-sm
                                font-semibold
                                text-slate-700
                                mb-3
                            ">
                                Choose language
                            </p>

                            <div className="
                                max-h-60
                                overflow-y-auto
                                space-y-1
                            ">

                                {languages.map(
                                    (language) => (
                                        <button
                                            key={language}
                                            type="button"
                                            onClick={() =>
                                                handleLanguageSelect(
                                                    language
                                                )
                                            }
                                            disabled={
                                                aiProcessing
                                            }
                                            className="
                                                w-full
                                                text-left
                                                px-4
                                                py-3
                                                rounded-xl
                                                hover:bg-indigo-50
                                                hover:text-indigo-600
                                                text-sm
                                                transition
                                            "
                                        >
                                            {language}
                                        </button>
                                    )
                                )}

                            </div>

                        </div>
                    )}
 
                    {showAISendConfirmation && (
    <div className="
        mt-5
        rounded-2xl
        border
        border-indigo-200
        bg-indigo-50
        p-4
    ">

        <div className="flex items-center gap-3 mb-4">

            <div className="
                h-10
                w-10
                rounded-full
                bg-indigo-600
                text-white
                flex
                items-center
                justify-center
            ">
                <Sparkles size={19} />
            </div>

            <div>
                <p className="font-semibold text-slate-800">
                    ChatVerse Assistant
                </p>

                <p className="text-xs text-slate-500">
                    Ready to send
                </p>
            </div>

        </div>


        {/* MESSAGE PREVIEW */}

        <div className="
            rounded-xl
            bg-white
            border
            border-indigo-100
            p-4
            mb-4
        ">

            <p className="
                text-xs
                font-semibold
                text-slate-400
                mb-2
            ">
                {aiTranslatedLanguage === "Original"
                    ? "Original message"
                    : `Translated to ${aiTranslatedLanguage}`
                }
            </p>

            <p className="
                text-sm
                text-slate-700
            ">
                {aiPreviewMessage}
            </p>

        </div>


        <p className="
            text-sm
            font-medium
            text-slate-700
            mb-3
        ">
            Would you like me to send this message?
        </p>


        <div className="flex gap-2">

            <button
                type="button"
                onClick={cancelAISend}
                disabled={aiProcessing}
                className="
                    flex-1
                    py-3
                    rounded-xl
                    bg-white
                    border
                    border-slate-200
                    font-semibold
                    hover:bg-slate-50
                "
            >
                Cancel
            </button>

            <button
                type="button"
                onClick={confirmAISend}
                disabled={aiProcessing}
                className="
                    flex-1
                    py-3
                    rounded-xl
                    bg-indigo-600
                    text-white
                    font-semibold
                    hover:bg-indigo-700
                    flex
                    items-center
                    justify-center
                    gap-2
                "
            >
                {aiProcessing ? (
                    <>
                        <Loader2
                            size={17}
                            className="animate-spin"
                        />
                        Sending...
                    </>
                ) : (
                    <>
                        <Send size={17} />
                        Send
                    </>
                )}
            </button>

        </div>
    </div>
)}


                    {/* PROCESSING */}

                    {aiProcessing && (
                        <div className="
                            flex
                            items-center
                            justify-center
                            gap-2
                            mt-5
                            text-sm
                            text-indigo-600
                        ">
                            <Loader2
                                size={17}
                                className="animate-spin"
                            />

                            Preparing message...
                        </div>
                    )}

                </div>
            )}

        </div>
    </div>
)}

   {/* =========================
    CREATE POLL MODAL
   ========================= */}

{showPollModal && (
    <div className="
        fixed
        inset-0
        z-[200]
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
            max-h-[90vh]
            overflow-y-auto
        ">

            {/* HEADER */}

            <div className="
                flex
                items-center
                justify-between
                mb-6
            ">

                <div className="
                    flex
                    items-center
                    gap-3
                ">

                    <div className="
                        h-11
                        w-11
                        rounded-2xl
                        bg-emerald-100
                        text-emerald-600
                        flex
                        items-center
                        justify-center
                    ">
                        <BarChart3 size={22} />
                    </div>

                    <div>

                        <h2 className="
                            text-lg
                            font-bold
                            text-slate-800
                        ">
                            Create Poll
                        </h2>

                        <p className="
                            text-xs
                            text-slate-400
                        ">
                            Ask your chat a question
                        </p>

                    </div>

                </div>


                <button
                    type="button"
                    onClick={() => {

                        setShowPollModal(false);

                        setPollQuestion("");

                        setPollOptions([
                            "",
                            ""
                        ]);

                    }}
                    className="
                        h-9
                        w-9
                        rounded-full
                        flex
                        items-center
                        justify-center
                        text-slate-400
                        hover:bg-slate-100
                    "
                >
                    <X size={18} />
                </button>

            </div>


            {/* QUESTION */}

            <label className="
                block
                text-sm
                font-semibold
                text-slate-700
                mb-2
            ">
                Question
            </label>

            <input
                type="text"
                value={pollQuestion}
                onChange={(e) =>
                    setPollQuestion(
                        e.target.value
                    )
                }
                placeholder="What should we do tonight?"
                maxLength={200}
                className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    border
                    border-slate-200
                    outline-none
                    focus:ring-2
                    focus:ring-indigo-500
                    text-sm
                "
            />


            {/* OPTIONS */}

            <div className="mt-5">

                <div className="
                    flex
                    items-center
                    justify-between
                    mb-2
                ">

                    <label className="
                        text-sm
                        font-semibold
                        text-slate-700
                    ">
                        Options
                    </label>

                    <span className="
                        text-xs
                        text-slate-400
                    ">
                        {pollOptions.length}/6
                    </span>

                </div>


                <div className="
                    space-y-2
                ">

                    {pollOptions.map(
                        (option, index) => (

                            <div
                                key={index}
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                <div className="
                                    h-9
                                    w-9
                                    rounded-full
                                    border
                                    border-slate-200
                                    flex
                                    items-center
                                    justify-center
                                    text-xs
                                    font-semibold
                                    text-slate-400
                                    shrink-0
                                ">
                                    {index + 1}
                                </div>


                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) =>
                                        updatePollOption(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    placeholder={`Option ${index + 1}`}
                                    maxLength={100}
                                    className="
                                        flex-1
                                        px-4
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-slate-200
                                        outline-none
                                        focus:ring-2
                                        focus:ring-indigo-500
                                        text-sm
                                    "
                                />


                                {pollOptions.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removePollOption(
                                                index
                                            )
                                        }
                                        className="
                                            h-9
                                            w-9
                                            rounded-full
                                            text-slate-400
                                            hover:bg-red-50
                                            hover:text-red-500
                                            flex
                                            items-center
                                            justify-center
                                        "
                                    >
                                        <X size={16} />
                                    </button>
                                )}

                            </div>

                        )
                    )}

                </div>


                {/* ADD OPTION */}

                {pollOptions.length < 6 && (
                    <button
                        type="button"
                        onClick={addPollOption}
                        className="
                            mt-3
                            text-sm
                            font-semibold
                            text-indigo-600
                            hover:text-indigo-700
                        "
                    >
                        + Add option
                    </button>
                )}

            </div>


            {/* MULTIPLE ANSWERS */}

            <label className="
                mt-5
                flex
                items-center
                gap-3
                cursor-pointer
            ">

                <input
                    type="checkbox"
                    checked={pollMultipleAnswers}
                    onChange={(e) =>
                        setPollMultipleAnswers(
                            e.target.checked
                        )
                    }
                    className="
                        h-4
                        w-4
                        accent-indigo-600
                    "
                />

                <div>

                    <p className="
                        text-sm
                        font-semibold
                        text-slate-700
                    ">
                        Allow multiple answers
                    </p>

                    <p className="
                        text-xs
                        text-slate-400
                    ">
                        People can select more than one option
                    </p>

                </div>

            </label>


            {/* CREATE */}

            <button
                type="button"
                onClick={createPoll}
                disabled={
                    creatingPoll ||
                    !pollQuestion.trim() ||
                    pollOptions
                        .filter(
                            option =>
                                option.trim()
                        )
                        .length < 2
                }
                className="
                    mt-6
                    w-full
                    py-3
                    rounded-xl
                    bg-indigo-600
                    text-white
                    font-semibold
                    hover:bg-indigo-700
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    transition
                    flex
                    items-center
                    justify-center
                    gap-2
                "
            >

                {creatingPoll ? (
                    <>
                        <Loader2
                            size={17}
                            className="animate-spin"
                        />

                        Creating...
                    </>
                ) : (
                    <>
                        <BarChart3 size={17} />

                        Create Poll
                    </>
                )}

            </button>

        </div>

    </div>
)}

    {editingMessage && (
    <div className="
        mb-3
        px-4
        py-3
        rounded-2xl
        bg-indigo-50
        border
        border-indigo-100
        flex
        items-center
        gap-3
    ">

        <div className="
            h-9
            w-9
            rounded-lg
            bg-indigo-100
            text-indigo-600
            flex
            items-center
            justify-center
        ">
            <Pencil size={17} />
        </div>

        <div className="flex-1 min-w-0">

            <p className="
                text-xs
                font-semibold
                text-indigo-600
            ">
                Editing message
            </p>

            <p className="
                text-sm
                text-slate-600
                truncate
            ">
                {editingMessage.content}
            </p>

        </div>

        <button
            type="button"
            onClick={onCancelEdit}
            className="
                h-8
                w-8
                rounded-full
                flex
                items-center
                justify-center
                text-slate-400
                hover:bg-white
                hover:text-slate-700
            "
        >
            <X size={17} />
        </button>

    </div>
)}

    {/* =========================
        MESSAGE INPUT ROW
       ========================= */}

    <div className="flex items-center gap-3">

        

        {/* =========================
            ATTACHMENT BUTTON
           ========================= */}

        <div className="relative">

            <button
                type="button"
                onClick={() =>
                    setShowAttachMenu(
                        previous => !previous
                    )
                }
                disabled={sending || uploading}
                className="
                    h-10
                    w-10
                    md:h-12
                    md:w-12
                    shrink-0
                    rounded-full
                    bg-slate-100
                    text-slate-500
                    hover:bg-indigo-50
                    hover:text-indigo-600
                    flex
                    items-center
                    justify-center
                    transition
                    disabled:opacity-50
                "
                title="Attach file"
            >
                <Paperclip size={19} />
            </button>


            {/* =========================
                ATTACHMENT MENU
               ========================= */}


            {showAttachMenu && (
                <div className="
                    absolute
                    bottom-14
                    left-0
                    z-50
                    w-52
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-2
                    shadow-2xl
                ">

                    {/* PHOTO */}

                    <label className="
                        flex
                        items-center
                        gap-3
                        px-3
                        py-3
                        rounded-xl
                        hover:bg-slate-100
                        cursor-pointer
                        transition
                    ">

                        <div className="
                            h-9
                            w-9
                            rounded-xl
                            bg-indigo-100
                            text-indigo-600
                            grid
                            place-items-center
                        ">
                            <Image size={18} />
                        </div>

                        <div>
                            <p className="text-sm font-semibold">
                                Photo
                            </p>

                            <p className="text-xs text-slate-400">
                                JPG, PNG, WebP
                            </p>
                        </div>

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                    </label>


                    {/* VIDEO */}

                    <label className="
                        flex
                        items-center
                        gap-3
                        px-3
                        py-3
                        rounded-xl
                        hover:bg-slate-100
                        cursor-pointer
                        transition
                    ">

                        <div className="
                            h-9
                            w-9
                            rounded-xl
                            bg-violet-100
                            text-violet-600
                            grid
                            place-items-center
                        ">
                            <Video size={18} />
                        </div>

                        <div>
                            <p className="text-sm font-semibold">
                                Video
                            </p>

                            <p className="text-xs text-slate-400">
                                MP4, WebM
                            </p>
                        </div>

                        <input
                            type="file"
                            accept="video/mp4,video/webm"
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                    </label>


                    {/* DOCUMENT */}

                    <label className="
                        flex
                        items-center
                        gap-3
                        px-3
                        py-3
                        rounded-xl
                        hover:bg-slate-100
                        cursor-pointer
                        transition
                    ">

                        <div className="
                            h-9
                            w-9
                            rounded-xl
                            bg-orange-100
                            text-orange-600
                            grid
                            place-items-center
                        ">
                            <FileText size={18} />
                        </div>

                        <div>
                            <p className="text-sm font-semibold">
                                Document
                            </p>

                            <p className="text-xs text-slate-400">
                                PDF, DOC, DOCX
                            </p>
                        </div>

                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                    </label>

                    {/* POLL */}

<button
    type="button"
    onClick={() => {
        setShowPollModal(true);
        setShowAttachMenu(false);
    }}
    disabled={sending || uploading}
    className="
        w-full
        flex
        items-center
        gap-3
        px-3
        py-3
        rounded-xl
        hover:bg-slate-100
        transition
        text-left
    "
>
    <div className="
        h-9
        w-9
        rounded-xl
        bg-emerald-100
        text-emerald-600
        grid
        place-items-center
        shrink-0
    ">
        <BarChart3 size={18} />
    </div>

    <div>
        <p className="
            text-sm
            font-semibold
            text-slate-700
        ">
            Poll
        </p>

        <p className="
            text-xs
            text-slate-400
        ">
            Ask a question
        </p>
    </div>
</button>
                
                </div>
            )}

        </div>
        
        

        {/* =========================
            TEXT INPUT
           ========================= */}

        <textarea
    value={content}
    onChange={handleTyping}
    onKeyDown={(e) => {

        // Shift + Enter = always new line
        if (e.key === "Enter" && e.shiftKey) {
            return;
        }

        // Enter to send is enabled
        if (
            e.key === "Enter" &&
            !e.shiftKey &&
            enterToSend
        ) {

            e.preventDefault();

            handleSend(e);
        }

        // Enter to send OFF
        // Do nothing → textarea creates new line

    }}
    placeholder={
        isRecording
            ? "Recording voice..."
            : "Type a message..."
    }
    disabled={
        sending ||
        isRecording ||
        uploading
    }
    rows={1}
    className="
        flex-1
        bg-slate-100
        rounded-2xl
        px-5
        py-3
        outline-none
        focus:ring-2
        focus:ring-indigo-500
        disabled:opacity-60
        resize-none
        max-h-32
        overflow-y-auto
    "
/>

    {/* AI ASSISTANT */}
<button
    type="button"
    onClick={startAIAssistant}
    disabled={
        sending ||
        uploading ||
        isRecording
    }
    className="
        w-12
        h-12
        shrink-0
        rounded-full
        flex
        items-center
        justify-center
        transition
        bg-indigo-50
        text-indigo-600
        hover:bg-indigo-100
        hover:text-indigo-700
        disabled:opacity-50
    "
    title="ChatVerse AI Assistant"
>
    <Sparkles size={20} />
</button>
    
        <button
    type="button"
    onClick={
        isRecording
            ? stopRecording
            : startRecording
    }
    disabled={sending || uploading}
    className={`
        w-12
        h-12
        shrink-0
        rounded-full
        flex
        items-center
        justify-center
        transition
        ${
            isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600"
        }
    `}
    title={
        isRecording
            ? "Stop recording"
            : "Voice message"
    }
>
    {isRecording ? (
        <Square size={17} />
    ) : (
        <Mic size={20} />
    )}
</button>

        {/* =========================
            SEND TEXT BUTTON
           ========================= */}

        <button
            type="submit"
            disabled={
                sending ||
                uploading ||
                isRecording ||
                !content.trim()
            }
            className="
                w-12
                h-12
                shrink-0
                rounded-full
                bg-indigo-600
                text-white
                flex
                items-center
                justify-center
                hover:bg-indigo-700
                disabled:bg-slate-300
                transition
            "
        >
            {editingMessage ? (
        <Pencil size={19} />
    ) : (
        <Send size={19} />
    )}
        </button>

    </div>

</form>
    );
}

export default MessageInput;