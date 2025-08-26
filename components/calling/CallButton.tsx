'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Video, 
  PhoneOff, 
  VideoOff,
  MoreHorizontal 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCall } from '@/hooks/use-call';
import { toast } from 'sonner';

interface CallButtonProps {
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showDropdown?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function CallButton({
  receiverId,
  receiverName,
  receiverAvatar,
  variant = 'outline',
  size = 'default',
  className = '',
  showDropdown = false,
  disabled = false,
  children
}: CallButtonProps) {
  const { initiateCall, callState } = useCall();
  const [isLoading, setIsLoading] = useState(false);

  const handleVoiceCall = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await initiateCall(receiverId, receiverName, 'voice');
    } catch (error) {
      console.error('Error initiating voice call:', error);
      toast.error('Failed to start call');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoCall = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await initiateCall(receiverId, receiverName, 'video');
    } catch (error) {
      console.error('Error initiating video call:', error);
      toast.error('Failed to start video call');
    } finally {
      setIsLoading(false);
    }
  };

  const isInCall = callState.status !== 'idle';

  if (showDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            disabled={disabled || isInCall}
          >
            {children || <Phone className="w-4 h-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleVoiceCall} disabled={isLoading}>
            <Phone className="w-4 h-4 mr-2" />
            Call
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleVideoCall} disabled={isLoading}>
            <Video className="w-4 h-4 mr-2" />
            Video Call
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex space-x-1">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleVoiceCall}
        disabled={disabled || isInCall || isLoading}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        ) : (
          <Phone className="w-4 h-4" />
        )}
        {children && <span className="ml-2">{children}</span>}
      </Button>
      
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleVideoCall}
        disabled={disabled || isInCall || isLoading}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        ) : (
          <Video className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

// Simple call button variants
export function QuickCallButton({ receiverId, receiverName, ...props }: CallButtonProps) {
  return (
    <CallButton
      receiverId={receiverId}
      receiverName={receiverName}
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      {...props}
    />
  );
}

export function PrimaryCallButton({ receiverId, receiverName, ...props }: CallButtonProps) {
  return (
    <CallButton
      receiverId={receiverId}
      receiverName={receiverName}
      variant="default"
      size="lg"
      className="px-6"
      {...props}
    >
      Call
    </CallButton>
  );
}

export function FloatingCallButton({ receiverId, receiverName, ...props }: CallButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <CallButton
        receiverId={receiverId}
        receiverName={receiverName}
        variant="default"
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        {...props}
      >
        <Phone className="w-5 h-5" />
      </CallButton>
    </div>
  );
}
