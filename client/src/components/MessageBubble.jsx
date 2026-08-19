function MessageBubble({ text, isOwnMessage }) {
    return (
        <div
           className={
            isOwnMessage
            ? "message own"
            : "message"
           }
        >
           {text}
        </div>
    );
}

export default MessageBubble;