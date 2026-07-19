"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CustomerChatPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat/admins")
      .then((r) => r.json())
      .then((d) => {
        const adminList = d.admins || [];
        setAdmins(adminList);
        if (adminList.length > 0) setSelectedAdmin(adminList[0]);
      });
  }, []);

  useEffect(() => {
    if (!selectedAdmin) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [selectedAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    if (!selectedAdmin) return;
    const res = await fetch(`/api/chat?with=${selectedAdmin.id}`);
    const data = await res.json();
    if (data.success) setMessages(data.messages);
  }

  async function sendMessage() {
    if (!message.trim() || !selectedAdmin) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: selectedAdmin.id, message }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setMessage("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Chat</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Chat with MoveOn support</p>
      </div>

      <div className="rounded-2xl flex flex-col overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)", height: "500px" }}>
        {selectedAdmin ? (
          <>
            <div className="p-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold" style={{ background: "rgba(200,146,42,0.15)", color: "var(--gold)" }}>
                M
              </div>
              <div>
                <p className="text-white font-semibold">MoveOn Support</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Usually replies within minutes</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="mx-auto mb-2" style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Start a conversation with our support team
                  </p>
                </div>
              )}
              {messages.map((msg) => {
                const isCustomer = msg.fromUser.role === "CUSTOMER";
                return (
                  <div key={msg.id} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-xs rounded-2xl px-4 py-2.5 text-sm"
                      style={{
                        background: isCustomer ? "var(--gold)" : "var(--background)",
                        color: isCustomer ? "black" : "white",
                        border: isCustomer ? "none" : "1px solid var(--border)",
                      }}
                    >
                      <p>{msg.message}</p>
                      <p className="text-xs mt-1 opacity-60">
                        {new Date(msg.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
              <Button onClick={sendMessage} disabled={sending || !message.trim()} className="font-semibold text-white shrink-0" style={{ background: "var(--gold)" }}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: "var(--muted-foreground)" }}>Loading support...</p>
          </div>
        )}
      </div>
    </div>
  );
}