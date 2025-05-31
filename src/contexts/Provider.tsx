import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import useLocalStorage from "../hooks/useLocalStorage.tsx";
import {
    TelepartyClient,
    SocketEventHandler,
    SocketMessageTypes,
    SessionChatMessage,
    MessageList,
} from "teleparty-websocket-lib";
import { SocketMessage } from "teleparty-websocket-lib/lib/SocketMessage";
import { ERRORS } from "../constants.tsx";

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
    const userIdRef = useRef(user.id);

    const [client, setClient] = useState<TelepartyClient | null>(null);
    const [typing, setIsTyping] = useState<boolean>(false);
    const isConnectedRef = useRef(false);

    const [isExiting, setIsExiting] = useLocalStorage<boolean>("is-exiting", false);
    const isExitingRef = useRef(isExiting);

    useEffect(() => {
        let newClient: TelepartyClient | null = null;
        const eventHandler: SocketEventHandler = {
            onConnectionReady: async () => {
                try {
                    console.log("Connection has been established");
                    isConnectedRef.current = true;

                    isExitingRef.current = false;
                    setIsExiting(false);
                    setClient(newClient);
                } catch (error) {
                    console.error("Failed to join room:", error);
                }
                isExitingRef.current = false;
            },
            onClose: async () => {
                try {
                    console.log("Socket has been closed");
                    isConnectedRef.current = false;

                    if (isExitingRef.current) {
                        console.log("Intentional exit - clearing room and user data");
                        setIsOptionSelected(false);

                        setUser({
                            id: "",
                            nickname: "",
                            icon: "",
                        });
                        userIdRef.current = "";
                        setRoom({
                            id: "",
                            participants: [],
                            messages: [],
                        });
                    } else {
                        setIsOptionSelected(false);
                    }
                } catch (error) {
                    console.error("Failed to close socket:", error);
                }
            },
            onMessage: async (message: SocketMessage) => {
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

                        userIdRef.current = message.data.userId;

                        if (newClient && !isExitingRef.current && room.id && user.nickname)
                            await joinRoom(user.nickname, room.id, user.icon, newClient);
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
                        if (
                            message.data?.usersTyping &&
                            message.data?.usersTyping[0] !== userIdRef.current &&
                            message.data.anyoneTyping
                        ) {
                            setIsTyping(true);
                        } else {
                            setIsTyping(false);
                        }
                        break;
                }
            },
        };

        newClient = new TelepartyClient(eventHandler);
        setClient(newClient);

        return () => {
            if (newClient) newClient.teardown();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnectedRef.current]);

    const joinRoom = async (
        nickname: string,
        roomId: string,
        userIcon: string,
        clientInstance?: TelepartyClient
    ) => {
        if (!isConnectedRef.current) throw new Error(ERRORS.NOT_CONNECTED);

        const activeClient = clientInstance || client;
        if (!activeClient) throw new Error("Client not available");

        const data: MessageList = await activeClient.joinChatRoom(nickname, roomId, userIcon);

        setRoom((prevRoom) => ({
            ...prevRoom,
            id: roomId,
            messages: data.messages,
        }));
        setUser((prevUser) => ({
            ...prevUser,
            ...(Boolean(nickname) && { nickname: nickname }),
            ...(Boolean(userIcon) && { icon: userIcon }),
        }));
        setIsOptionSelected(true);
    };

    const setTyping = (typing: boolean) => {
        if (!isConnectedRef.current) throw new Error(ERRORS.NOT_CONNECTED);

        client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
            typing: typing,
        });
    };

    const createRoom = async (nickname: string, userIcon: string) => {
        if (!isConnectedRef.current) throw new Error(ERRORS.NOT_CONNECTED);

        const _user = {
            id: userIdRef.current,
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
        if (!isConnectedRef.current) throw new Error(ERRORS.NOT_CONNECTED);

        try {
            client.sendMessage(SocketMessageTypes.SEND_MESSAGE, { body: message.data });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const exitRoom = () => {
        console.log("Exiting room...");

        isExitingRef.current = true;
        setIsExiting(true);
        // Clear room and user data
        setRoom({
            id: "",
            participants: [],
            messages: [],
        });
        setUser({
            id: userIdRef.current,
            nickname: "",
            icon: "",
        });

        // Close the connection
        if (client) client.teardown();
        window.location.reload();

        setIsOptionSelected(false);
    };

    return (
        <Context.Provider
            value={{
                room,
                createRoom,
                sendMessage,
                setTyping,
                isConnected: isConnectedRef.current,
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
