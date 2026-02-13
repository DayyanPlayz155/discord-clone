"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    // 1. Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Set up Realtime & Presence
    const channel = supabase.channel("general-chat", {
      config: { presence: { key: user?.username || "anonymous" } },
    });

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, 
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing: string[] = [];
        
        // Loop through everyone in the channel to see who is typing
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
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

    await supabase.from("messages").insert([
      { 
        content: newMessage, 
        user_name: user?.username || "Guest",
        user_id: user?.id 
      },
    ]);
    
    setNewMessage("");
    // Stop typing status after sending
    const channel = supabase.channel("general-chat");
    channel.track({ user: user?.username, isTyping: false });
  };

  const onTyping = (val: string) => {
    setNewMessage(val);
    const channel = supabase.channel("general-chat");
    channel.track({ 
      user: user?.username || "Guest", 
      isTyping: val.length > 0 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#313338] text-white p-4">
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="border-b border-gray-700 pb-2">
            <span className="font-bold text-blue-400">{msg.user_name}: </span>
            <span>{msg.content}</span>
          </div>
        ))}
      </div>

      {/* Typing Indicator */}
      <div className="h-6 text-xs text-gray-400 italic">
        {typingUsers.length === 1 && `${typingUsers[0]} is typing...`}
        {typingUsers.length === 2 && `${typingUsers[0]} and ${typingUsers[1]} are typing...`}
        {typingUsers.length > 2 && `Several people are typing...`}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => onTyping(e.target.value)}
          placeholder="Message #general"
          className="flex-1 bg-[#383a40] p-2 rounded outline-none"
        />
        <button type="submit" className="bg-indigo-500 px-4 py-2 rounded">Send</button>
      </form>
    </div>
  );
}