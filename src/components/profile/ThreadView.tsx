import React, { RefObject } from "react";

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
  error: string | null;
  noMessagesText: string;
  children: React.ReactNode;
};

const ThreadView: React.FC<Props> = ({ containerRef, loading, error, noMessagesText, children }) => {
  return (
    <div ref={containerRef} className="flex-1 overflow-auto p-3 sm:p-4 space-y-3">
      {loading && (
        <div className="text-sm text-gray-500 text-center py-4">{noMessagesText.replace(/No messages.*$/i, "Loading messages...")}</div>
      )}
      {error && (
        <div className="text-sm text-red-600 text-center py-4">{error}</div>
      )}
      {!loading && !error && React.Children.count(children) === 0 && (
        <div className="text-sm text-gray-500">{noMessagesText}</div>
      )}
      {children}
    </div>
  );
};

export default ThreadView;
