'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Phone, 
  Video, 
  Users, 
  Settings, 
  Bell,
  MessageSquare,
  User,
  Building,
  MoreHorizontal
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useCall } from '@/hooks/use-call';
import PhoneCall from '@/components/calling/PhoneCall';
import CallButton, { 
  QuickCallButton, 
  PrimaryCallButton, 
  FloatingCallButton 
} from '@/components/calling/CallButton';
import { Navbar } from '@/components/shared/navbar';

// Mock contacts for demo
const mockContacts = [
  {
    id: '1',
    name: 'John Smith',
    avatar: '/avatars/john.jpg',
    role: 'Software Engineer',
    department: 'Engineering',
    isOnline: true,
    lastSeen: '2 minutes ago'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    avatar: '/avatars/sarah.jpg',
    role: 'Product Manager',
    department: 'Product',
    isOnline: true,
    lastSeen: 'Online'
  },
  {
    id: '3',
    name: 'Mike Davis',
    avatar: '/avatars/mike.jpg',
    role: 'Designer',
    department: 'Design',
    isOnline: false,
    lastSeen: '1 hour ago'
  },
  {
    id: '4',
    name: 'Emily Wilson',
    avatar: '/avatars/emily.jpg',
    role: 'Marketing Manager',
    department: 'Marketing',
    isOnline: true,
    lastSeen: 'Online'
  }
];

export default function CallingDemoPage() {
  const { user } = useUser();
  const { callState, endCall } = useCall();
  const [selectedContact, setSelectedContact] = useState(mockContacts[0]);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');

  const handleEndCall = () => {
    endCall();
  };

  const handleToggleMute = () => {
    console.log('Toggle mute');
  };

  const handleToggleVideo = () => {
    console.log('Toggle video');
  };

  const handleToggleSpeaker = () => {
    console.log('Toggle speaker');
  };

  const handleAcceptCall = () => {
    console.log('Accept call');
  };

  const handleRejectCall = () => {
    console.log('Reject call');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Phone App Demo</h1>
          <p className="text-gray-600">
            Try out the calling features with voice and video calls.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contacts List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Contacts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedContact.id === contact.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={contact.avatar} alt={contact.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contact.name}
                        </p>
                        {contact.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{contact.role}</p>
                    </div>
                    
                    <QuickCallButton
                      receiverId={contact.id}
                      receiverName={contact.name}
                      disabled={!contact.isOnline}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Call Controls & Demo */}
          <div className="lg:col-span-2 space-y-4">
            {/* Selected Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Call Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-lg">
                      {selectedContact.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{selectedContact.name}</h3>
                    <p className="text-sm text-gray-600">{selectedContact.role}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Building className="w-3 h-3 mr-1" />
                        {selectedContact.department}
                      </Badge>
                      <Badge variant={selectedContact.isOnline ? "default" : "secondary"} className="text-xs">
                        {selectedContact.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="callType">Call Type</Label>
                    <Select value={callType} onValueChange={(value: 'voice' | 'video') => setCallType(value)}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="voice">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center">
                            <Video className="w-4 h-4 mr-2" />
                            Video
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CallButton
                      receiverId={selectedContact.id}
                      receiverName={selectedContact.name}
                      variant="default"
                      size="lg"
                      className="flex-1"
                      disabled={!selectedContact.isOnline}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Start {callType === 'video' ? 'Video' : ''} Call
                    </CallButton>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CallButton
                      receiverId={selectedContact.id}
                      receiverName={selectedContact.name}
                      showDropdown={true}
                      variant="outline"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </CallButton>
                    
                    <Button variant="outline" size="icon">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call Button Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Call Button Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Primary Call Button</Label>
                    <PrimaryCallButton
                      receiverId={selectedContact.id}
                      receiverName={selectedContact.name}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quick Call Buttons</Label>
                    <div className="flex space-x-2">
                      <QuickCallButton
                        receiverId={selectedContact.id}
                        receiverName={selectedContact.name}
                      />
                      <QuickCallButton
                        receiverId={selectedContact.id}
                        receiverName={selectedContact.name}
                        variant="default"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Call Options Menu</Label>
                  <CallButton
                    receiverId={selectedContact.id}
                    receiverName={selectedContact.name}
                    showDropdown={true}
                    variant="outline"
                  >
                    More Options
                  </CallButton>
                </div>
              </CardContent>
            </Card>

            {/* Simple Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-answer calls</Label>
                      <p className="text-sm text-gray-500">Automatically accept incoming calls</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Noise cancellation</Label>
                      <p className="text-sm text-gray-500">Reduce background noise</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Call Button */}
        <FloatingCallButton
          receiverId={selectedContact.id}
          receiverName={selectedContact.name}
        />
      </div>

      {/* Phone Call Interface */}
      {callState.status !== 'idle' && (
        <PhoneCall
          participants={callState.participants}
          callType={callState.callType}
          onEndCall={handleEndCall}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onToggleSpeaker={handleToggleSpeaker}
          callStatus={callState.status}
          callDuration={callState.callDuration}
          isIncoming={callState.isIncoming}
          onAcceptCall={handleAcceptCall}
          onRejectCall={handleRejectCall}
        />
      )}
    </div>
  );
}
