import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageCircle, X, Minus } from "lucide-react";
import type { ChatMessage } from "@shared/schema";

interface ChatPanelProps {
  threadType: "order" | "admin_driver";
  threadId: string;
  currentUserId: string;
  title?: string;
  collapsed?: boolean;
  onClose?: () => void;
}

export function ChatPanel({ threadType, threadId, currentUserId, title, collapsed, onClose }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(!collapsed);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const endpoint = threadType === "order"
    ? `/api/chat/order/${threadId}`
    : `/api/chat/admin-driver/${threadId}`;

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: [endpoint],
    refetchInterval: isOpen ? 5000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      return apiRequest("POST", endpoint, { body });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const chatTitle = title || (threadType === "order" ? "Order Chat" : "Admin Chat");

  if (!isOpen) {
    return (
      <Button
        data-testid="button-open-chat"
        variant="default"
        size="default"
        className="gap-2 shadow-lg"
        style={{ position: "fixed", bottom: "16px", right: "16px", zIndex: 9999 }}
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-4 w-4" />
        Chat
        {messages && messages.length > 0 && (
          <Badge variant="secondary" className="ml-1">{messages.length}</Badge>
        )}
      </Button>
    );
  }

  return (
    <Card
      className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-4 sm:w-80 max-h-[70vh] sm:max-h-[28rem] flex flex-col shadow-lg z-[9999]"
      data-testid="chat-panel"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2 min-w-0">
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">{chatTitle}</span>
        </CardTitle>
        <div className="flex items-center gap-1 shrink-0">
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-chat">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} data-testid="button-minimize-chat">
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[12rem] max-h-[calc(70vh-8rem)] sm:max-h-[18rem]">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2 ml-auto" />
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => {
            const isMine = msg.senderUserId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                data-testid={`chat-message-${msg.id}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {!isMine && (
                    <div className="text-xs font-medium opacity-70 mb-0.5">
                      {msg.senderName || msg.senderRole}
                    </div>
                  )}
                  <div style={{ overflowWrap: "break-word" }}>{msg.body}</div>
                  <div className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/60" : "opacity-50"}`}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-sm text-muted-foreground py-6">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="border-t p-2 flex items-center gap-2">
        <Input
          ref={inputRef}
          data-testid="input-chat-message"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sendMutation.isPending}
          className="text-sm"
        />
        <Button
          size="icon"
          data-testid="button-send-message"
          onClick={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
