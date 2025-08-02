'use client';
/**
 * importing Board and sidebar from  @/components/shared/
 */
import Board from "@/components/shared/Board";
import SideBar from "@/components/shared/SideBar";


export default function Page() {

    return (
        <div className="flex min-h-screen ">
            {/* Sidebar */}
            <SideBar />
            {/* Content */}
            <main className="flex-1 p-6 overflow-y-auto">
                <Board />
            </main>
        </div>
    );
}
