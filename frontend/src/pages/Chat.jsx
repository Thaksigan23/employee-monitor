import { useState, useEffect, useRef, useMemo } from "react";
import { fetchChatList, fetchConversation, sendMessage } from "../services/api";

export default function Chat() {
  const [chatList, setChatList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  // Load chat list
  useEffect(() => {
    loadChatList();
    const interval = setInterval(loadChatList, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll conversation when a user is selected
  useEffect(() => {
    if (!selectedUser) return;
    loadConversation(selectedUser._id);
    const interval = setInterval(() => loadConversation(selectedUser._id), 3000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadChatList() {
    try {
      const data = await fetchChatList();
      setChatList(data);
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  }

  async function loadConversation(userId) {
    try {
      const data = await fetchConversation(userId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMsg.trim() || !selectedUser || sending) return;

    try {
      setSending(true);
      await sendMessage(selectedUser._id, newMsg.trim());
      setNewMsg("");
      await loadConversation(selectedUser._id);
      loadChatList();
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const filteredList = chatList.filter(
    (c) => c.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = chatList.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="flex h-[calc(100vh-3rem)] -m-6 overflow-hidden">
      {/* ---- Sidebar: Chat List ---- */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              💬 Chats
              {totalUnread > 0 && (
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </h2>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Chat contacts */}
        <div className="flex-1 overflow-y-auto">
          {filteredList.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">
              No conversations yet
            </div>
          )}
          {filteredList.map((chat) => (
            <button
              key={chat.user._id}
              onClick={() => setSelectedUser(chat.user)}
              className={`w-full text-left p-4 border-b dark:border-gray-700 flex items-center gap-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                selectedUser?._id === chat.user._id
                  ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                  : ""
              }`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                chat.user.role === "admin"
                  ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
              }`}>
                {chat.user.email[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate">{chat.user.email}</span>
                  {chat.lastMessage && (
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(chat.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {chat.lastMessage
                      ? (chat.lastMessage.senderId === currentUser.id ? "You: " : "") + chat.lastMessage.text
                      : "Start a conversation"}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ---- Main Chat Area ---- */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {!selectedUser ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">
                Select a conversation
              </h3>
              <p className="text-gray-400 mt-1 text-sm">
                Choose someone from the list to start chatting
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                selectedUser.role === "admin"
                  ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
              }`}>
                {selectedUser.email[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{selectedUser.email}</div>
                <div className="text-xs text-gray-400 capitalize">{selectedUser.role}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-10">
                  No messages yet. Say hello! 👋
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender._id === currentUser.id || msg.sender === currentUser.id;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${
                        isMe
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md border dark:border-gray-700"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                      <div
                        className={`text-[10px] mt-1 ${
                          isMe ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="px-6 py-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-xl border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMsg.trim() || sending}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-3 rounded-xl font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  {sending ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                  Send
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
