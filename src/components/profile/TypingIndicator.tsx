import React, { PropsWithChildren } from "react";

type TypingIndicatorProps = PropsWithChildren<object>;

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ children }) => {
  return (
    <div className="px-3 sm:px-4 py-2">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span>{children}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
