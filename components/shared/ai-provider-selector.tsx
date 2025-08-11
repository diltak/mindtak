'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DeepConversationToggleProps {
  deepConversation: boolean;
  onDeepConversationChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function DeepConversationToggle({
  deepConversation,
  onDeepConversationChange,
  disabled = false
}: DeepConversationToggleProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between space-x-3 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-blue-600" />
          <Label htmlFor="deep-conversation" className="text-sm font-medium cursor-pointer">
            Deep Conversation
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-3 w-3 rounded-full bg-gray-300 flex items-center justify-center cursor-help">
                <span className="text-xs text-white font-bold">?</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                Enables real-time web search for up-to-date mental health information and research
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <Switch
          id="deep-conversation"
          checked={deepConversation}
          onCheckedChange={onDeepConversationChange}
          disabled={disabled}
        />
      </div>
    </TooltipProvider>
  );
}
