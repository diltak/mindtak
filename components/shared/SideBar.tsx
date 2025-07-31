/**
 * importing the ui component from shadcn, 
 */

import {
    User,
    Users,
  LayoutDashboard,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";


/**
 * temp data for ui testing purpose
 */
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Employee", href: "/employee/dashboard", icon: <Users size={18} /> },
  { label: "Employer", href: "/Employer/dashboard", icon: <User size={18} /> },
];

export default function SideBar () {

  const pathname = usePathname();

    return (
        <>
        <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-zinc-900 ">
          <div className="text-">
          <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900">
            <Brain className="h-8 w-8 text-blue-600" />
            <span>Mind-DiLTak</span>
          </Link>
        </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                  {navItems.map(({ label, href, icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                        pathname === href
                          ? "bg-zinc-100 dark:bg-zinc-800 font-medium"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      {icon}
                      <span>{label}</span>
                    </Link>
                  ))}
                </nav>
              </aside>
        </>
    )
}