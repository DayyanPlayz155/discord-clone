"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // This Ref holds the active "radio" connection
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // 1. Fetch History
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Start Realtime & Debugging
    console.log("Attempting to connect to Realtime..."); 

    const myName = user?.firstName || user?.username || "Guest";

    const channel = supabase.channel("general-chat", {
      config: { presence: { key: myName } },
    });

    channelRef.current = channel;

    channel
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "messages" 
      }, (payload) => {
        console.log("🔥 NEW MESSAGE RECEIVED LIVE!", payload); 
        setMessages((prev) => [...prev, payload.new]);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing: string[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.isTyping && p.user !== myName) {
              typing.push(p.user);
            }
          });
        });
        setTypingUsers(typing);
      })
      .subscribe((status) => {
        // THIS IS THE MOST IMPORTANT LOG
        console.log("📡 Realtime Status:", status); 
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const myName = user?.firstName || user?.username || "Guest";

    const { error } = await supabase.from("messages").insert([
      { 
        content: newMessage, 
        user_name: myName,
        user_id: user?.id 
      },
    ]);
    
    if (error) console.error("Error sending message:", error);

    setNewMessage("");
    channelRef.current?.track({ user: myName, isTyping: false });
  };

  const onTyping = (val: string) => {
    setNewMessage(val);
    const myName = user?.firstName || user?.username || "Guest";
    
    if (channelRef.current) {
      channelRef.current.track({ 
        user: myName, 
        isTyping: val.length > 0 
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#313338] text-white p-4 font-sans">
      <div className="border-b border-[#26272d] pb-2 mb-4">
        <h1 className="text-xl font-bold text-gray-100"># general-chat</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className="group hover:bg-[#2e3035] p-1 rounded transition">
            <span className="font-bold text-[#5865F2]">{msg.user_name}</span>
            <span className="text-gray-500 text-[10px] ml-2">
               {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
            <p className="text-[#dbdee1]">{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="h-5 text-xs text-gray-400 italic mb-1 ml-1">
        {typingUsers.length > 0 && (
          <span>
            {typingUsers.length === 1 && `${typingUsers[0]} is typing...`}
            {typingUsers.length === 2 && `${typingUsers[0]} and ${typingUsers[1]} are typing...`}
            {typingUsers.length > 2 && `Several people are typing...`}
          </span>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => onTyping(e.target.value)}
          placeholder="Message #general"
          className="flex-1 bg-[#383a40] p-3 rounded-lg outline-none focus:ring-1 ring-[#5865F2]"
        />
        <button type="submit" className="bg-[#5865F2] hover:bg-[#4752C4] px-6 py-2 rounded-lg font-bold">
          Send
        </button>
      </form>
    </div>
  );
}