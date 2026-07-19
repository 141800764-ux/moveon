"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminChatPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []));
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    if (!selectedUser) return;
    const res = await fetch(`/api/chat?with=${selectedUser.id}`);
    const data = await res.json();
    if (data.success) setMessages(data.messages);
  }

  async function sendMessage() {
    if (!message.trim() || !selectedUser) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: selectedUser.id, message }),
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
    <div className="space-y-6 h-full">
      <div>
        <h1 className="text-3xl font-bold text-white">Customer Chat</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>Message customers directly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "600px" }}>
        {/* Customer list */}
        <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="font-semibold text-white">Customers</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {customers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => setSelectedUser(customer)}
                className="w-full text-left p-4 transition hover:bg-white/5 flex items-center gap-3"
                style={{
                  background: selectedUser?.id === customer.id ? "rgba(200,146,42,0.1)" : "transparent",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: "rgba(200,146,42,0.15)", color: "var(--gold)" }}>
                  {customer.name?.[0] || "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{customer.name}</p>
                  {customer.receivedMessages?.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--gold)", color: "black" }}>
                      {customer.receivedMessages.length} new
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="lg:col-span-2 rounded-2xl flex flex-col overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {selectedUser ? (
            <>
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold" style={{ background: "rgba(200,146,42,0.15)", color: "var(--gold)" }}>
                  {selectedUser.name?.[0]}
                </div>
                <p className="text-white font-semibold">{selectedUser.name}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isAdmin = msg.fromUser.role !== "CUSTOMER";
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-xs rounded-2xl px-4 py-2.5 text-sm"
                        style={{
                          background: isAdmin ? "var(--gold)" : "var(--background)",
                          color: isAdmin ? "black" : "white",
                          border: isAdmin ? "none" : "1px solid var(--border)",
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
                  placeholder="Type a message..."
                  style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
                <Button onClick={sendMessage} disabled={sending || !message.trim()} className="font-semibold text-white shrink-0" style={{ background: "var(--gold)" }}>
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
                <p style={{ color: "var(--muted-foreground)" }}>Select a customer to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}