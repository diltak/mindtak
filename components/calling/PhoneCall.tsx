'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX,
  MoreVertical,
  MessageSquare,
  Clock,
  User as UserIcon,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import type { User } from '@/types/index';

interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'caller' | 'receiver';
  isOnline: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
}

interface PhoneCallProps {
  participants: CallParticipant[];
  callType: 'voice' | 'video';
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
  callStatus: 'initiating' | 'ringing' | 'active' | 'ended' | 'rejected';
  callDuration?: number;
  isIncoming?: boolean;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
}

export default function PhoneCall({
  participants,
  callType,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  callStatus,
  callDuration = 0,
  isIncoming = false,
  onAcceptCall,
  onRejectCall
}: PhoneCallProps) {
  const { user } = useUser();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  const currentParticipant = participants.find(p => p.id !== user?.id) || participants[0];

  useEffect(() => {
    if (callStatus === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    onToggleMute();
  };

  const handleToggleVideo = () => {
    if (callType === 'video') {
      setIsVideoOn(!isVideoOn);
      onToggleVideo();
    }
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    onToggleSpeaker();
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'initiating':
        return 'Calling...';
      case 'ringing':
        return isIncoming ? 'Incoming call' : 'Ringing...';
      case 'active':
        return formatTime(elapsedTime);
      case 'ended':
        return 'Call ended';
      case 'rejected':
        return 'Call rejected';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'active':
        return 'text-green-500';
      case 'ringing':
        return 'text-blue-500';
      case 'ended':
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-white border-0 shadow-xl rounded-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <Avatar className="w-16 h-16 mx-auto mb-3">
                <AvatarImage src={currentParticipant.avatar} alt={currentParticipant.name} />
                <AvatarFallback className="text-lg bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {currentParticipant.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {callStatus === 'active' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            
            <h2 className="text-lg font-medium text-gray-900 mb-1">
              {currentParticipant.name}
            </h2>
            
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {callType === 'video' ? <Video className="w-3 h-3 mr-1" /> : <Phone className="w-3 h-3 mr-1" />}
                {callType === 'video' ? 'Video' : 'Voice'}
              </Badge>
              {callStatus === 'active' && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(elapsedTime)}
                </Badge>
              )}
            </div>
            
            <p className={`text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>

          {/* Call Controls */}
          {callStatus === 'active' && (
            <div className="space-y-4 mb-6">
              {/* Video Preview (for video calls) */}
              {callType === 'video' && (
                <div className="relative bg-gray-100 rounded-lg h-24 mb-4 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-6 h-6 text-gray-400" />
                  </div>
                  {isVideoOn && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex justify-center space-x-3">
                <Button
                  variant={isMuted ? "destructive" : "outline"}
                  size="icon"
                  className="w-10 h-10 rounded-full"
                  onClick={handleToggleMute}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                {callType === 'video' && (
                  <Button
                    variant={!isVideoOn ? "destructive" : "outline"}
                    size="icon"
                    className="w-10 h-10 rounded-full"
                    onClick={handleToggleVideo}
                  >
                    {!isVideoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </Button>
                )}

                <Button
                  variant={isSpeakerOn ? "default" : "outline"}
                  size="icon"
                  className="w-10 h-10 rounded-full"
                  onClick={handleToggleSpeaker}
                >
                  {isSpeakerOn ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Incoming Call Controls */}
          {isIncoming && callStatus === 'ringing' && (
            <div className="space-y-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Incoming {callType} call
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button
                  variant="destructive"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={onRejectCall}
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="default"
                  size="icon"
                  className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600"
                  onClick={onAcceptCall}
                >
                  <Phone className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* End Call Button */}
          {callStatus === 'active' && (
            <div className="flex justify-center">
              <Button
                variant="destructive"
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={onEndCall}
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Call Ended/Rejected State */}
          {(callStatus === 'ended' || callStatus === 'rejected') && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <PhoneOff className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-600">
                {callStatus === 'ended' ? 'Call ended' : 'Call rejected'}
              </p>
              <Button onClick={onEndCall} className="w-full">
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
