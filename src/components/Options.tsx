import React, { useState } from "react";
import { OPTION_TYPES } from "../constants.tsx";
import { useStore } from "../contexts/Provider.tsx";
import avatar1 from "../assets/avatar_1.jpg";
import avatar2 from "../assets/avatar_2.jpg";
import avatar3 from "../assets/avatar_3.jpg";
import avatar4 from "../assets/avatar_4.jpg";
import avatar5 from "../assets/avatar_5.jpg";
import avatar6 from "../assets/avatar_6.jpg";

const Options = ({
    setIsOptionSelected,
}: {
    setIsOptionSelected: (isOptionSelected: boolean) => void;
}) => {
    const [activeTab, setActiveTab] = useState<OPTION_TYPES.CREATE | OPTION_TYPES.JOIN>(
        OPTION_TYPES.CREATE
    );
    const [error, setError] = useState<string | null>(null);
    const { createRoom, joinRoom, isConnected } = useStore();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const avatarOptions = [
        { id: 1, src: avatar1, alt: "Avatar 1" },
        { id: 2, src: avatar2, alt: "Avatar 2" },
        { id: 3, src: avatar3, alt: "Avatar 3" },
        { id: 4, src: avatar4, alt: "Avatar 4" },
        { id: 5, src: avatar5, alt: "Avatar 5" },
        { id: 6, src: avatar6, alt: "Avatar 6" },
    ];

    const handleImageSelect = (imageSrc: string) => {
        setSelectedImage(imageSrc);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const nickname = e.target.nickname.value;

        try {
            if (activeTab === OPTION_TYPES.CREATE) {
                await createRoom(nickname, selectedImage);
            } else {
                const roomId = e.target.roomId.value;
                await joinRoom(nickname, roomId, selectedImage);
            }

            setIsOptionSelected(true);
        } catch (error) {
            setError(error.message || "An error occurred");
        }
    };

    return (
        <div className="flex flex-col justify-center items-center h-full">
            <div>
                <div className="bg-[#F2EFE7] rounded-lg shadow-md md:w-96 max-w-full">
                    <div className="flex border-b">
                        <button
                            className={`py-2 px-4 w-1/2 font-medium ${
                                activeTab === OPTION_TYPES.CREATE
                                    ? "text-[#006A71] border-b-2 border-[#006A71]"
                                    : "text-gray-500"
                            }`}
                            onClick={() => setActiveTab(OPTION_TYPES.CREATE)}
                        >
                            Create Room
                        </button>
                        <button
                            className={`py-2 px-4 w-1/2 font-medium ${
                                activeTab === OPTION_TYPES.JOIN
                                    ? "text-[#006A71] border-b-2 border-[#006A71]"
                                    : "text-gray-500"
                            }`}
                            onClick={() => setActiveTab(OPTION_TYPES.JOIN)}
                        >
                            Join Room
                        </button>
                    </div>

                    <div className="p-6">
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label
                                    htmlFor="nickname"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Nickname
                                </label>
                                <input
                                    type="text"
                                    id="nickname"
                                    name="nickname"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#48A6A7] focus:border-[#48A6A7]"
                                    placeholder="Enter your nickname"
                                />
                            </div>
                            {activeTab === OPTION_TYPES.JOIN && (
                                <div>
                                    <label
                                        htmlFor="roomId"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Room ID
                                    </label>
                                    <input
                                        type="text"
                                        id="roomId"
                                        name="roomId"
                                        required={activeTab === OPTION_TYPES.JOIN}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#48A6A7] focus:border-[#48A6A7]"
                                        placeholder="Enter room ID"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Profile Image
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {avatarOptions.map((avatar) => (
                                        <div key={avatar.id} className="flex flex-col items-center">
                                            <div className={`relative cursor-pointer `}>
                                                <input
                                                    type="radio"
                                                    id={avatar.id}
                                                    name="profileImage"
                                                    className="sr-only"
                                                    checked={selectedImage === avatar.src}
                                                    onChange={() =>
                                                        handleImageSelect(
                                                            avatar.src.replace(
                                                                "/teleparty_messenger/static/media/",
                                                                ""
                                                            )
                                                        )
                                                    }
                                                />
                                                <img
                                                    src={avatar.src}
                                                    alt={avatar.alt}
                                                    className="h-16 w-16 object-cover rounded-full border border-gray-300"
                                                    onClick={() =>
                                                        handleImageSelect(
                                                            avatar.src.replace(
                                                                "/teleparty_messenger/static/media/",
                                                                ""
                                                            )
                                                        )
                                                    }
                                                />
                                                {avatar.src?.includes(selectedImage) && (
                                                    <div className="absolute -top-1 -right-1 bg-[#48A6A7] rounded-full w-5 h-5 flex items-center justify-center">
                                                        <span className="text-white text-xs">
                                                            ✓
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#48A6A7] hover:bg-[#006A71] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9ACBD0] ${
                                    !isConnected ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={!isConnected}
                            >
                                {isConnected
                                    ? activeTab === OPTION_TYPES.CREATE
                                        ? "Create Room"
                                        : "Join Room"
                                    : "Connecting to server..."}
                            </button>
                        </form>
                        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Options;
