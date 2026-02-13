"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // This "Ref" keeps the connection alive across the whole page
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // 1. Get old messages first
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Start the Realtime "Radio Station"
    const channel = supabase.channel("general-chat", {
      config: { presence: { key: user?.username || "Guest" } },
    });

    channelRef.current = channel;

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, 
        (payload) => {
          // This makes messages appear WITHOUT reloading!
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing: string[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            // If someone else is typing, add them to the list
            if (p.isTyping && p.user !== user?.username) {
              typing.push(p.user);
            }
          });
        });
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Send to Database
    await supabase.from("messages").insert([
      { 
        content: newMessage, 
        user_name: user?.username || "Guest",
        user_id: user?.id 
      },
    ]);
    
    setNewMessage("");
    // Tell others you stopped typing
    channelRef.current?.track({ user: user?.username, isTyping: false });
  };

  const onTyping = (val: string) => {
    setNewMessage(val);
    // Broadcast "I am typing" to everyone else
    if (channelRef.current) {
      channelRef.current.track({ 
        user: user?.username || "Guest", 
        isTyping: val.length > 0 
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#313338] text-white p-4 font-sans">
      {/* Header */}
      <div className="border-b border-gray-800 pb-2 mb-4">
        <h1 className="text-xl font-bold"># general-chat</h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className="group hover:bg-[#2e3035] p-1 rounded">
            <span className="font-bold text-[#5865F2]">{msg.user_name}</span>
            <span className="text-gray-400 text-[10px] ml-2">
               {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
            <p className="text-gray-200">{msg.content}</p>
          </div>
        ))}
      </div>

      {/* Typing Indicator Box */}
      <div className="h-6 text-xs text-gray-400 italic mb-1 ml-1">
        {typingUsers.length > 0 && (
          <span>
            {typingUsers.length === 1 && `${typingUsers[0]} is typing...`}
            {typingUsers.length === 2 && `${typingUsers[1]} and ${typingUsers[0]} are typing...`}
            {typingUsers.length > 2 && `Several people are typing...`}
          </span>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => onTyping(e.target.value)}
          placeholder="Message #general"
          className="flex-1 bg-[#383a40] p-3 rounded-lg outline-none focus:ring-1 ring-indigo-500"
        />
        <button type="submit" className="bg-[#5865F2] hover:bg-[#4752C4] px-6 py-2 rounded-lg font-bold transition">
          Send
        </button>
      </form>
    </div>
  );
}