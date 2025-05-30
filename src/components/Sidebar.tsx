import React from "react";
import { useStore } from "../contexts/Provider.tsx";

const Sidebar = () => {
    const { room } = useStore();

    return (
        <div className="hidden md:flex flex-col gap-3">
            <div className="text-center text-sm">Participants</div>
            <div className="flex flex-col flex-grow justify-between bg-[#48A6A7] border-t-4 border-[#006A71] rounded-lg">
                <div className="flex flex-col">
                    {room?.participants?.map((participant, index) => (
                        <div
                            className="p-2 flex flex-col border-b-2 border-[#006A71]/40 items-center"
                            key={index}
                        >
                            {participant.icon ? (
                                <img
                                    src={`/teleparty_messenger/static/media/${participant.icon}`}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full bg-[#006A71] flex items-center justify-center mb-1"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-[#006A71] flex items-center justify-center mb-1">
                                    <span className="text-white font-medium">
                                        {participant.nickname.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <span className="text-sm font-light">
                                {participant.nickname ? participant.nickname : participant.id}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
