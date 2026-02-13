"use client";

import React, { useState } from 'react';
import { Hash, Settings, Mic, Headphones, Plus, Compass, Download, MessageSquare, Gift, Sticker, Smile, PlusCircle } from 'lucide-react';
// 1. Clerk Imports
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function DiscordClone() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome to the clone!", user: "System", time: "12:00 PM" },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSend = (e: any) => {
    if (e.key === 'Enter' && inputValue.trim() !== "") {
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([...messages, { id: Date.now(), text: inputValue, user: "You", time: t }]);
      setInputValue("");
    }
  };

  return (
    <div className="flex h-screen bg-[#313338] text-[#dbdee1] font-sans overflow-hidden">
      
      {/* --- SERVER SIDEBAR --- */}
      <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 space-y-2 flex-shrink-0">
        <div className="w-12 h-12 bg-[#5865f2] rounded-[16px] flex items-center justify-center text-white cursor-pointer hover:rounded-[16px] transition-all duration-200">
          <MessageSquare size={28} />
        </div>
        <div className="w-8 h-[2px] bg-[#35363c] rounded-full mx-auto" />
        <div className="w-12 h-12 bg-[#313338] rounded-[24px] flex items-center justify-center text-[#23a559] cursor-pointer hover:rounded-[16px] hover:bg-[#23a559] hover:text-white transition-all duration-200">
          <Plus size={25} />
        </div>
      </div>

      {/* --- CHANNEL SIDEBAR --- */}
      <div className="w-60 bg-[#2b2d31] flex flex-col flex-shrink-0">
        <div className="h-12 px-4 flex items-center shadow-sm font-bold text-white border-b border-[#1f2023]">
          Discord Clone
        </div>
        <div className="flex-1 overflow-y-auto pt-3 px-2">
          <div className="flex items-center px-2 py-1 mb-1 text-[#80848e] hover:text-[#dbdee1] cursor-pointer group">
            <Hash size={20} className="mr-1.5" />
            <span className="font-medium">general</span>
          </div>
        </div>
        
        {/* --- USER AREA WITH CLERK --- */}
        <div className="h-[52px] bg-[#232428] px-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* 2. Clerk Component: Shows User Avatar if logged in */}
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
              <div className="text-xs">
                <p className="text-white font-bold leading-tight">Logged In</p>
                <p className="text-[#b5bac1]">Online</p>
              </div>
            </SignedIn>

            {/* 3. Clerk Component: Shows Sign In button if logged out */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-[#5865f2] text-white text-xs px-3 py-1.5 rounded hover:bg-[#4752c4] transition">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
          <div className="flex space-x-2 text-[#b5bac1]">
            <Mic size={20} className="hover:text-[#dbdee1] cursor-pointer" />
            <Headphones size={20} className="hover:text-[#dbdee1] cursor-pointer" />
            <Settings size={20} className="hover:text-[#dbdee1] cursor-pointer" />
          </div>
        </div>
      </div>

      {/* --- CHAT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
        <div className="h-12 px-4 flex items-center shadow-sm border-b border-[#1f2023] justify-between">
          <div className="flex items-center">
            <Hash size={24} className="text-[#80848e] mr-2" />
            <span className="font-bold text-white">general</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start hover:bg-[#2e3035] -mx-4 px-4 py-1 group">
              <div className="w-10 h-10 bg-gray-600 rounded-full mr-4 mt-1 flex-shrink-0" />
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="font-medium text-white hover:underline cursor-pointer">{m.user}</span>
                  <span className="text-[12px] text-[#80848e]">{m.time}</span>
                </div>
                <p className="text-[#dbdee1] leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-6">
          <div className="bg-[#383a40] rounded-lg px-4 flex items-center h-11">
            <PlusCircle className="text-[#b5bac1] hover:text-[#dbdee1] cursor-pointer mr-4" />
            <input 
              className="bg-transparent flex-1 text-[#dbdee1] focus:outline-none placeholder-[#87898e] text-[15px]" 
              placeholder="Message #general"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleSend}
            />
            <div className="flex space-x-3 text-[#b5bac1] ml-2">
              <Gift size={24} className="hover:text-[#dbdee1] cursor-pointer" />
              <Sticker size={24} className="hover:text-[#dbdee1] cursor-pointer" />
              <Smile size={24} className="hover:text-[#dbdee1] cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}