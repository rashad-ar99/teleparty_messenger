import React, { createContext, useContext, useState, useEffect } from "react";
import useLocalStorage from "../hooks/useLocalStorage.tsx";
import {
    TelepartyClient,
    SocketEventHandler,
    SocketMessageTypes,
    SessionChatMessage,
    MessageList,
} from "teleparty-websocket-lib";
import { SocketMessage } from "teleparty-websocket-lib/lib/SocketMessage";

export type Participant = {
    id: string;
    nickname: string;
    icon?: string;
};

export type Room = {
    id: string;
    participants: Participant[];
    messages: Message[];
};

const Context = createContext();
export const useStore = () => useContext(Context);

export const Provider = ({
    setIsOptionSelected,
    children,
}: {
    setIsOptionSelected: (isOptionSelected: boolean) => void;
    children: any;
}) => {
    const [room, setRoom] = useLocalStorage<Room>("room", () => ({
        id: "",
        participants: [],
        messages: [],
    }));
    const [user, setUser] = useLocalStorage<User>("user", () => ({
        id: "",
        nickname: "",
        icon: "",
    }));

    const [client, setClient] = useState<TelepartyClient | null>(null);
    const [typing, setIsTyping] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        const eventHandler: SocketEventHandler = {
            onConnectionReady: () => {
                console.log("Connection has been established");
                setIsConnected(true);
                setRoom({
                    id: "",
                    participants: [],
                    messages: [],
                });
                setUser({
                    id: user.id,
                    nickname: "",
                    icon: "",
                });
            },
            onClose: () => {
                console.log("Socket has been closed");
                setIsConnected(false);
                setIsOptionSelected(false);
                setRoom({
                    id: "",
                    participants: [],
                    messages: [],
                });
                setUser({
                    id: user.id,
                    nickname: "",
                    icon: "",
                });
            },
            onMessage: (message: SocketMessage) => {
                if (room) {
                    console.log("message", message);
                    switch (message.type) {
                        case "userId":
                            setUser((prevUser) => ({
                                ...prevUser,
                                id: message.data.userId,
                                ...(Boolean(message.data.nickname) && {
                                    nickname: message.data.nickname,
                                }),
                                ...(Boolean(message.data.icon) && {
                                    icon: message.data.icon,
                                }),
                            }));
                            break;
                        case "userList":
                            setRoom((prevRoom) => ({
                                ...prevRoom,
                                participants: [
                                    ...message.data.map((user) => ({
                                        id: user.userSettings.id,
                                        nickname: user.userSettings.userNickname,
                                        icon: user.userSettings.userIcon,
                                    })),
                                ],
                            }));
                            break;
                        case SocketMessageTypes.SEND_MESSAGE:
                            const newMessage: SessionChatMessage = {
                                body: message.data.body,
                                isSystemMessage: message.data.isSystemMessage,
                                timestamp: message.data.timestamp,
                                permId: message.data.permId,
                                userIcon: message.data.userIcon,
                                userNickname: message.data.userNickname,
                            };

                            setRoom((prevRoom) => {
                                return {
                                    ...prevRoom,
                                    messages: [...prevRoom.messages, newMessage],
                                };
                            });
                            break;
                        case SocketMessageTypes.SET_TYPING_PRESENCE:
                            setIsTyping(message.data);
                            break;
                    }
                }
            },
        };

        const newClient = new TelepartyClient(eventHandler);
        setClient(newClient);

        return () => {
            if (client) client.teardown();
        };
    }, []);
    const joinRoom = async (nickname: string, roomId: string, userIcon: string) => {
        if (!isConnected)
            throw new Error("Please connect to the server first. Try refreshing the page.");

        const data: MessageList = await client.joinChatRoom(nickname, roomId, userIcon);

        setRoom((prevRoom) => ({
            ...prevRoom,
            id: roomId,
            messages: data.messages,
        }));
        setUser((prevUser) => ({
            ...prevUser,
            ...(Boolean(user.id) && { id: user.id }),
            ...(Boolean(nickname) && { nickname: nickname }),
            ...(Boolean(userIcon) && { icon: userIcon }),
        }));
    };

    const setTyping = (typing: boolean) => {
        if (!isConnected)
            throw new Error("Please connect to the server first. Try refreshing the page.");

        client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
            typing: typing,
        });
    };

    const createRoom = async (nickname: string, userIcon: string) => {
        if (!isConnected)
            throw new Error("Please connect to the server first. Try refreshing the page.");

        const _user = {
            id: user.id,
            nickname: nickname,
            icon: userIcon,
        };
        setUser((prevUser) => ({ ...prevUser, ..._user }));

        const roomId = await client.createChatRoom(nickname, userIcon);

        setRoom((prevRoom) => ({
            ...prevRoom,
            id: roomId,
        }));
    };

    const sendMessage = (message: {
        type: SocketMessageTypes;
        data: string;
        callbackId: string;
        timestamp: Date;
    }) => {
        if (!isConnected)
            throw new Error("Please connect to the server first. Try refreshing the page.");

        client.sendMessage(SocketMessageTypes.SEND_MESSAGE, { body: message.data });
    };

    const exitRoom = () => {
        setRoom({
            id: "",
            participants: [],
            messages: [],
        });
        setUser({
            id: user.id,
            nickname: "",
            icon: "",
        });
        client.teardown();
    };

    return (
        <Context.Provider
            value={{
                room,
                createRoom,
                sendMessage,
                setTyping,
                isConnected,
                joinRoom,
                user,
                exitRoom,
                typing,
            }}
        >
            {children}
        </Context.Provider>
    );
};
