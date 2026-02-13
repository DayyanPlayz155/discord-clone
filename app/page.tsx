"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";

// Define what a Message looks like
interface Message {
  id: string;
  content: string;
  user_name: string;
  created_at: string;
}

export default function DiscordClone() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  // 1. Fetch old messages and Listen for new ones
  useEffect(() => {
    // Get existing messages from the database
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    // REAL-TIME: Listen for new rows added to the 'messages' table
    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Function to send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const { error } = await supabase.from("messages").insert([
      {
        content: inputText,
        user_id: user.id,
        user_name: user.fullName || user.username || "Anonymous",
      },
    ]);

    if (error) {
      console.error("Error sending:", error.message);
    } else {
      setInputText(""); // Clear the box
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      {/* Header */}
      <header style={{ padding: "10px", borderBottom: "1px solid #1e1f22", display: "flex", justifyContent: "space-between" }}>
        <h3># general-chat</h3>
        <SignedOut>
          <SignInButton mode="modal" />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>

      {/* Message List */}
      <main style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: "15px" }}>
            <strong style={{ color: "#5865F2" }}>{msg.user_name}</strong>
            <span style={{ fontSize: "12px", color: "#949ba4", marginLeft: "10px" }}>
              {new Date(msg.created_at).toLocaleTimeString()}
            </span>
            <p style={{ margin: "5px 0 0 0" }}>{msg.content}</p>
          </div>
        ))}
      </main>

      {/* Input Area */}
      <footer style={{ padding: "20px" }}>
        <SignedIn>
          <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message #general"
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#383a40", color: "white" }}
            />
            <button type="submit" style={{ padding: "10px 20px", background: "#5865F2", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
              Send
            </button>
          </form>
        </SignedIn>
        <SignedOut>
          <p style={{ textAlign: "center", color: "#949ba4" }}>Please sign in to join the chat.</p>
        </SignedOut>
      </footer>
    </div>
  );
}