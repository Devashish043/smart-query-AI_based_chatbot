
import React from 'react';
import { Button } from '@/components/ui/button';

interface NewConversationButtonProps {
  onNewConversation: () => void;
}

const NewConversationButton = ({ onNewConversation }: NewConversationButtonProps) => {
  return (
    <Button
      onClick={onNewConversation}
      variant="outline"
      size="sm"
      className="border-slate-600 text-slate-300 hover:bg-slate-800"
      title="Start New Conversation"
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
        />
      </svg>
    </Button>
  );
};

export default NewConversationButton;
