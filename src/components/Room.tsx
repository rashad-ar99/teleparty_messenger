import React, { useState, useCallback } from "react";
import { useStore } from "../contexts/Provider.tsx";
import { SocketMessageTypes } from "teleparty-websocket-lib";

const Room = ({
    setIsOptionSelected,
}: {
    setIsOptionSelected: (isOptionSelected: boolean) => void;
}) => {
    let typingTimeout: NodeJS.Timeout;
    const { sendMessage, user, room, exitRoom, setTyping, typing } = useStore();
    const [message, setMessage] = useState("");

    const lastMessageRef = useCallback((node: any) => {
        if (node) node.scrollIntoView({ behavior: "smooth" });
    }, []);

    const getInitial = (nickname: string) => {
        return nickname ? nickname.charAt(0).toUpperCase() : "?";
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();

        sendMessage({
            type: SocketMessageTypes.SEND_MESSAGE,
            data: message,
            callbackId: new Date().toISOString(),
            timestamp: new Date().toISOString(),
        });

        setMessage("");
    };

    return (
        <div className="flex flex-col gap-3 justify-between h-[95vh]">
            <div className="flex justify-between">
                <span className="text-xs font-light text-gray-500">
                    <span className="font-bold">{user.nickname}</span> ({user.id})
                </span>
                <button
                    className="text-xs font-light text-gray-500 hover:text-red-700"
                    onClick={() => {
                        setIsOptionSelected(false);
                        exitRoom();
                    }}
                >
                    Exit Room
                </button>
            </div>
            <div className="text-md font-light">Room ID: {room?.id}</div>
            <div className="flex flex-col flex-grow p-3 overflow-y-auto no-scrollbar space-y-3">
                {room?.messages &&
                    room.messages.map((message, index) => {
                        const fromMe =
                            message.userSettings?.id === user.id ||
                            message.userSettings?.userNickname === user.nickname;
                        const nickname = fromMe
                            ? user.nickname
                            : message.userSettings?.userNickname ||
                              message.userSettings?.id ||
                              "Unknown";
                        const userId = message.userSettings?.id || "unknown";

                        return message.isSystemMessage ? (
                            <div
                                key={message.messageId}
                                ref={index === room?.messages?.length - 1 ? lastMessageRef : null}
                                className="text-xs text-gray-500 text-center"
                            >
                                {message.userSettings?.userNickname
                                    ? message.userSettings?.userNickname
                                    : message.userSettings?.id}{" "}
                                {message.body}
                            </div>
                        ) : (
                            <div
                                ref={index === room?.messages?.length - 1 ? lastMessageRef : null}
                                key={message.messageId}
                                className={`flex ${
                                    fromMe ? "flex-row-reverse" : "flex-row"
                                } items-start gap-2`}
                            >
                                {message.userSettings?.userIcon ? (
                                    <img
                                        src={message.userSettings.userIcon}
                                        alt={`${nickname}'s avatar`}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium bg-[#48A6A7]">
                                        {getInitial(nickname)}
                                    </div>
                                )}

                                <div
                                    className={`flex flex-col max-w-[75%] gap-1 ${
                                        fromMe && "items-end"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {fromMe ? "You" : nickname}
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#DCF8C6] shadow-sm break-words">
                                        <div className="text-md">{message.body}</div>
                                        <div className="">
                                            <div className="text-xs text-gray-500 text-right mt-1">
                                                {new Date(message.timestamp).toLocaleTimeString(
                                                    [],
                                                    {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
            <div className="">
                {typing?.usersTyping &&
                    typing?.usersTyping[0] !== user.id &&
                    typing.anyoneTyping && <div className="text-xs text-gray-500">Typing...</div>}
            </div>
            <form onSubmit={handleSubmit}>
                <div className="flex gap-5 p-1">
                    <input
                        className="flex-grow p-3 h-15 rounded-md focus:outline-none shadow-lg"
                        type="textarea"
                        value={message}
                        onKeyDown={(e) => {
                            clearTimeout(typingTimeout);

                            setTyping(true);
                        }}
                        onChange={(e) => {
                            setMessage(e.target.value);
                        }}
                        onKeyUp={(e) => {
                            clearTimeout(typingTimeout);

                            typingTimeout = setTimeout(() => {
                                setTyping(false);
                            }, 2000);
                        }}
                        placeholder="Type your message here..."
                    />
                    <button className="h-14 p-3 rounded-full bg-[#006A71] text-white">send</button>
                </div>
            </form>
        </div>
    );
};

export default Room;
