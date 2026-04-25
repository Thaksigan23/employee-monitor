import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { io } from "socket.io-client";
import { fetchChatList, fetchConversation, sendMessage } from "../services/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket = null;

function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("token");
    socket = io(API_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export default function Chat() {
  const [chatList, setChatList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);

  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);

  // Load chat list via REST (initial + refresh)
  const loadChatList = useCallback(async () => {
    try {
      const data = await fetchChatList();
      setChatList(data);
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  }, []);

  const loadConversation = useCallback(async (userId) => {
    try {
      const data = await fetchConversation(userId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }, []);

  // Socket.IO setup
  useEffect(() => {
    const sock = getSocket();

    sock.on("connect", () => setConnected(true));
    sock.on("disconnect", () => setConnected(false));

    sock.on("online_users", (users) => setOnlineUsers(users));

    sock.on("new_message", (msg) => {
      // Update conversation if it's from our selected user
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
      // Refresh chat list for unread count
      loadChatList();
    });

    sock.on("user_typing", ({ senderId, isTyping }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: isTyping }));
    });

    return () => {
      sock.off("connect");
      sock.off("disconnect");
      sock.off("online_users");
      sock.off("new_message");
      sock.off("user_typing");
    };
  }, [loadChatList]);

  // Initial load
  useEffect(() => {
    loadChatList();
    const interval = setInterval(loadChatList, 10000); // Refresh list every 10s (for unread counts)
    return () => clearInterval(interval);
  }, [loadChatList]);

  // Load conversation when user selected
  useEffect(() => {
    if (!selectedUser) return;
    loadConversation(selectedUser._id);
  }, [selectedUser, loadConversation]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!newMsg.trim() || !selectedUser || sending) return;
    try {
      setSending(true);
      // Send via REST (controller will emit to receiver via Socket.IO)
      const sent = await sendMessage(selectedUser._id, newMsg.trim());
      setMessages((prev) => [...prev, sent]);
      setNewMsg("");
      loadChatList();
      // Stop typing indicator
      getSocket().emit("typing", { receiverId: selectedUser._id, isTyping: false });
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  }

  function handleTyping(e) {
    setNewMsg(e.target.value);
    if (!selectedUser) return;
    const sock = getSocket();
    sock.emit("typing", { receiverId: selectedUser._id, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      sock.emit("typing", { receiverId: selectedUser._id, isTyping: false });
    }, 2000);
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const filteredList = chatList.filter(
    (c) => c.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = chatList.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const selectedUserTyping = selectedUser && typingUsers[selectedUser._id];

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 lg:-m-6 overflow-hidden rounded-xl shadow-lg border dark:border-gray-700">
      {/* ---- Sidebar: Chat List ---- */}
      <div className="w-72 lg:w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              💬 Chats
              {totalUnread > 0 && (
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </h2>
            <div className={`flex items-center gap-1 text-xs ${connected ? "text-green-500" : "text-gray-400"}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
              {connected ? "Live" : "Offline"}
            </div>
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
            <div className="p-6 text-center text-gray-400 text-sm">No conversations yet</div>
          )}
          {filteredList.map((chat) => {
            const isOnline = onlineUsers.includes(chat.user._id);
            const isTyping = typingUsers[chat.user._id];
            return (
              <button
                key={chat.user._id}
                onClick={() => setSelectedUser(chat.user)}
                className={`w-full text-left p-3 border-b dark:border-gray-700/50 flex items-center gap-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  selectedUser?._id === chat.user._id
                    ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                    : ""
                }`}
              >
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    chat.user.role === "admin"
                      ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                      : "bg-gradient-to-br from-blue-500 to-cyan-500"
                  }`}>
                    {chat.user.email[0].toUpperCase()}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                    isOnline ? "bg-green-500" : "bg-gray-300"
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">{chat.user.email.split("@")[0]}</span>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`text-xs truncate ${isTyping ? "text-blue-500 italic" : "text-gray-500 dark:text-gray-400"}`}>
                      {isTyping
                        ? "typing..."
                        : chat.lastMessage
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
            );
          })}
        </div>
      </div>

      {/* ---- Main Chat Area ---- */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 min-w-0">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">Select a conversation</h3>
              <p className="text-gray-400 mt-1 text-sm">Choose someone from the list to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-5 py-3.5 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center gap-3 shadow-sm">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  selectedUser.role === "admin"
                    ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                    : "bg-gradient-to-br from-blue-500 to-cyan-500"
                }`}>
                  {selectedUser.email[0].toUpperCase()}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                  onlineUsers.includes(selectedUser._id) ? "bg-green-500" : "bg-gray-300"
                }`} />
              </div>
              <div>
                <div className="font-semibold">{selectedUser.email}</div>
                <div className="text-xs text-gray-400 capitalize">
                  {onlineUsers.includes(selectedUser._id) ? "🟢 Online" : "⚫ Offline"} · {selectedUser.role}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hello! 👋</div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender?._id === currentUser.id || msg.sender === currentUser.id;
                return (
                  <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${
                        isMe
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md border dark:border-gray-700"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      <div className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                        {formatTime(msg.createdAt)}
                        {isMe && <span className="ml-1">✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {selectedUserTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-5 py-3.5 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMsg}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMsg.trim() || sending}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  {sending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
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
