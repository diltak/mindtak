'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Brain, LogOut, Settings, User } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import type { User as UserType } from '@/types';

interface NavbarProps {
  user?: UserType;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    const error = await signOut(auth).catch((err) => err); // Catch potential errors from signOut
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      router.push('/');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isEmployeePath = pathname.startsWith('/employee');
  const isEmployerPath = pathname.startsWith('/employer');

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Mind-DiLTak</span>
          </Link>

          {/* Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-8">
              {user.role === 'employee' && (
                <>
                  <Link 
                    href="/employee/dashboard" 
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/employee/dashboard' 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/employee/reports" 
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/employee/reports' 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    My Reports
                  </Link>
                  <Link 
                    href="/employee/chat" 
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/employee/chat' 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    AI Assistant
                  </Link>
                </>
              )}
              
              {user.role === 'employer' && (
                <>
                  <Link 
                    href="/employer/dashboard" 
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/employer/dashboard' 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/employer/employees" 
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/employer/employees' 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Employees
                  </Link>
                  <Link 
                    href="/employer/analytics" 
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/employer/analytics' 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Analytics
                  </Link>
                </>
              )}
            </div>
          )}

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}