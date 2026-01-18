import React, { useState } from 'react';

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

const ChatInput: React.FC<Props> = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-2 p-2 border-t border-gray-200 dark:border-gray-700">
      <textarea
        className="flex-1 resize-none rounded-md px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none"
        rows={2}
        placeholder="Type your message..."
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
              onSend(value.trim());
              setValue('');
            }
          }
        }}
      />
      <button
        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-md disabled:opacity-50"
        disabled={disabled || !value.trim()}
        onClick={() => {
          if (value.trim()) {
            onSend(value.trim());
            setValue('');
          }
        }}
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;

