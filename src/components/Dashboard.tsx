import React from "react";
import Room from "./Room.tsx";
import Options from "./Options.tsx";
import Sidebar from "./Sidebar.tsx";

export const Dashboard = ({
    isOptionSelected,
    setIsOptionSelected,
}: {
    isOptionSelected: boolean;
    setIsOptionSelected: (isOptionSelected: boolean) => void;
}) => {
    return (
        <div className="grid p-3 gap-x-5 bg-[#F2EFE7]/70 h-screen">
            {!isOptionSelected ? (
                <div className="">
                    <Options setIsOptionSelected={setIsOptionSelected} />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-4 gap-3">
                        <Sidebar />
                        <div className="col-span-3 hidden md:block px-5 py-2 border-y-2 border-x-8 rounded-lg border-[#006A71]/30">
                            <Room setIsOptionSelected={setIsOptionSelected} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
