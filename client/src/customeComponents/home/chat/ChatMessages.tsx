import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useInfiniteScroll } from "@/customeComponents/common/useInfiniteScroll";
import useChatSockets from "@/hooks/chatHooks/useChatSocket";
import ChatInput from "./ChatInput";

const API_URL = "http://localhost:3001";
const MAX_PREVIEW_LENGTH = 40;

interface Message {
  _id: string;
  senderId: string;
  content: string;
  type?: "text" | "link";
  replyTo?: Message | null;
  createdAt?: string;
  sender?: {
    _id: string;
    avatar?: string;
  };
}

interface ChatMessagesProps {
  chatId: string;
  userId: string;
  darkMode: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ chatId, userId, darkMode }) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { messages, fetchMessages, hasMore, typing, loading, deleteMessage } = useChatSockets(chatId, userId);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editMode, setEditMode] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<{ [key: string]: boolean }>({});

  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useInfiniteScroll(chatContainerRef, fetchMessages, hasMore, loading);

  useEffect(() => {
    if (messages.length > 0 && lastMessageRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const scrollToMessage = (messageId: string) => {
    const targetMessage = messageRefs.current[messageId];
    if (targetMessage) {
      targetMessage.scrollIntoView({ behavior: "smooth", block: "center" });
      setSelectedMessage(messageId);
    }
  };

  function getFileExtension(filenameOrUrl: string) {
    return filenameOrUrl.split('.').pop()?.toLowerCase() || "";
  }
  const handleReply = (message: Message) => {
    setReplyTo(message);
    setEditMode(null);
    setSelectedMessage(null);
    scrollToMessage(message._id);
  };

  const handleMessageClick = (id: string) => {
    setSelectedMessage((prev) => (prev === id ? null : id));
  };

  const handleReadMore = (id: string) => {
    setExpandedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLinkClick = (msg: Message) => {
    const fullUrl = msg.content.startsWith("http") ? msg.content : `${API_URL}/${msg.content}`;
    
    if (msg.content.startsWith("/home")) {
      navigate(msg.content); // Handle internal link
    } else {
      window.open(fullUrl, "_blank"); // External link
    }
  };

  return (
    <div className="flex flex-col h-[75vh]">
      {/* Chat Container */}
      <div
        ref={chatContainerRef}
        className={`flex flex-col-reverse flex-grow overflow-y-auto p-4 space-y-2 ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
        }`}
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`::-webkit-scrollbar { display: none; }`}</style>
  
        {/* Messages */}
        {messages.map((msg, index) => {
          const isSelf = msg?.sender?._id?._id === userId;
          const isSelected = selectedMessage === msg._id;
          return (
            <div
              key={msg._id}
              ref={(el) => (messageRefs.current[msg._id] = el)}
              className={`flex items-end gap-2 mb-2 ${isSelf ? "justify-end" : "justify-start"}`}
            >
              {/* Avatar */}
              {!isSelf && (
                <img
                  src={msg.sender?.avatar || "/default-avatar.png"}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              )}
  
              {/* Message Bubble */}
              <div
                onClick={() => handleMessageClick(msg._id)}
                onDoubleClick={() => handleMessageClick(msg._id)}
                className={`relative max-w-[70%] px-4 py-2 rounded-xl text-sm break-words whitespace-pre-wrap ${
                  isSelf ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                }`}
              >
                {/* Reply Preview */}
                {msg.replyTo && (
                  <p
                    className="text-xs italic text-green-400 border-l-2 border-green-300 pl-2 mb-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToMessage(msg.replyTo!._id);
                    }}
                  >
                    Replying to: {msg.replyTo.content}
                  </p>
                )}
  
                {/* LINK MESSAGE */}
                {msg.type === "link" ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLinkClick(msg);
                    }}
                    className={`p-2 rounded-md transition-colors cursor-pointer ${
                      isSelf ? "bg-white/10" : "bg-white"
                    }`}
                  >
                    <p className={`font-medium ${isSelf ? "text-white" : "text-black"}`}>
                      Check this out 👉
                    </p>
                    <a
                      className={`underline break-words ${
                        isSelf ? "text-blue-200 hover:text-blue-100" : "text-blue-600 hover:text-blue-800"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLinkClick(msg);
                      }}
                    >
                      {msg.content}
                    </a>
                  </div>
  
                ) : msg.type === "file" ? (
                  <>
                  {/* Text content preview if msg.content exists */}
                  {msg.content && (
                    <p className="mb-1">
                      {expandedMessages[msg._id] || msg.content.length <= MAX_PREVIEW_LENGTH
                        ? msg.content
                        : `${msg.content.slice(0, MAX_PREVIEW_LENGTH)}...`}
                      {msg.content.length > MAX_PREVIEW_LENGTH && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReadMore(msg._id);
                          }}
                          className="text-blue-300 underline ml-2"
                        >
                          {expandedMessages[msg._id] ? "Show Less" : "Read More"}
                        </button>
                      )}
                    </p>
                  )}
                
                  {/* File previews if msg.type === "file" or files exist */}
                  {(msg.type === "file" || msg.files?.length > 0) && (
                    <div className="mt-2 space-y-3">




{msg?.files.map((file, idx) => {
  const extension = getFileExtension(file.name || file.url);

  // Download button styled as a small pill
  const DownloadButton = () => (
    <a
      href={file.url}
      download={file.name}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block px-3 py-1 text-sm font-semibold text-blue-600 border border-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition"
    >
      Download
    </a>
  );

  const previewSize = "w-72 h-48"; // fixed width 18rem (288px), height 12rem (192px)

  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
    return (
      <div
        key={idx}
        className="mb-4 flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-3"
      >
        <img
          src={file.url}
          alt={file.name || "image"}
          className={`${previewSize} rounded-md border border-gray-300 dark:border-gray-700 object-contain`}
        />
        <div className="mt-2">
          <DownloadButton />
        </div>
      </div>
    );
  } else if (["mp4", "webm", "ogg"].includes(extension)) {
    return (
      <div
        key={idx}
        className="mb-4 flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-3"
      >
        <video
          src={file.url}
          controls
          className={`${previewSize} rounded-md border border-gray-300 dark:border-gray-700 object-contain`}
        />
        <div className="mt-2">
          <DownloadButton />
        </div>
      </div>
    );
  } else if (extension === "pdf") {
    return (
      <div
        key={idx}
        className="mb-4 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md p-3"
      >
        <iframe
          src={file.url}
          title={file.name || "PDF Preview"}
          className={`${previewSize} rounded-md border border-gray-300 dark:border-gray-700`}
          style={{ overflow: "auto" }}
        />
        <div className="mt-3 self-end">
          <DownloadButton />
        </div>
      </div>
    );
  } else {
    return (
      <div
        key={idx}
        className="mb-4 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <img src="/file-icon.png" alt="File icon" className="w-6 h-6" />
          <span className="text-sm font-medium truncate max-w-xs">{file.name || "Unknown file"}</span>
        </div>
        <DownloadButton />
      </div>
    );
  }
})}


                    </div>
                  )}
                </>
                
                ) : (
                  <>
                    {/* Default Text Message */}
                    <p>
                      {expandedMessages[msg._id] || msg.content.length <= MAX_PREVIEW_LENGTH
                        ? msg.content
                        : `${msg.content.slice(0, MAX_PREVIEW_LENGTH)}...`}
                    </p>
                    {msg.content.length > MAX_PREVIEW_LENGTH && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReadMore(msg._id);
                        }}
                        className="text-blue-300 underline mt-1"
                      >
                        {expandedMessages[msg._id] ? "Show Less" : "Read More"}
                      </button>
                    )}
                  </>
                )}
  
                {/* Timestamp */}
                {msg.createdAt && (
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                )}
  
                {/* Actions */}
                {isSelected && (
                  <div className="absolute bottom-[-30px] left-0 right-0 bg-gray-800 text-white flex justify-center gap-3 py-1 text-xs rounded-b-xl">
                    {isSelf ? (
                      <>
                        <button onClick={() => setEditMode(msg)} className="text-yellow-300 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => deleteMessage(msg._id)} className="text-red-400 hover:underline">
                          Delete
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleReply(msg)} className="text-blue-300 hover:underline">
                        Reply
                      </button>
                    )}
                  </div>
                )}
              </div>
  
              {/* Avatar */}
              {isSelf && (
                <img
                  src={msg.sender?.avatar || "/default-avatar.png"}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          );
        })}
  
        {/* Typing Indicator */}
        {typing && <p className="text-sm text-gray-500 self-start">Typing...</p>}
      </div>
  
      {/* Chat Input */}
      <ChatInput
        chatId={chatId}
        userId={userId}
        darkMode={darkMode}
        replyTo={replyTo}
        editMode={editMode}
        setReplyTo={setReplyTo}
        setEditMode={setEditMode}
        forEditMessage={(id, newContent) => {
          console.log("Edit Message:", id, newContent);
        }}
      />
    </div>
  );
  
};

export default ChatMessages;
