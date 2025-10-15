import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Mic, Video, Hand, Check, CheckCheck, X, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmojiPicker } from "@/components/EmojiPicker";
import { MessageActions } from "@/components/MessageActions";

interface Reaction {
  emoji: string;
  user_id: string;
  count: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  translation: string | null;
  created_at: string;
  is_read: boolean;
  edited_at: string | null;
  parent_message_id: string | null;
  is_pinned: boolean;
  reactions: Reaction[];
  is_deleted: boolean;
}

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [userMode, setUserMode] = useState<string>("normal");
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && conversationId) {
      fetchUserPreferences();
      fetchMessages();
      const unsubMessages = subscribeToMessages();
      const unsubTyping = subscribeToTyping();
      markMessagesAsRead();
      
      return () => {
        unsubMessages();
        unsubTyping();
      };
    }
  }, [user, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("user_mode")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      if (data) setUserMode(data.user_mode);
    } catch (error: any) {
      console.error("Error fetching preferences:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []).map((msg) => ({
        ...msg,
        reactions: Array.isArray(msg.reactions) 
          ? (msg.reactions as any[]).map((r: any) => ({
              emoji: r.emoji || "",
              user_id: r.user_id || "",
              count: r.count || 1,
            }))
          : [],
      })) as Message[]);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user?.id)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (!newMsg.is_deleted) {
            setMessages((current) => [...current, newMsg]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((current) =>
            current.map((msg) => (msg.id === updated.id ? updated : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToTyping = () => {
    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          const { data } = await supabase
            .from("typing_indicators")
            .select("user_id, profiles(email)")
            .eq("conversation_id", conversationId)
            .neq("user_id", user?.id);

          if (data) {
            setTypingUsers(data.map((d: any) => d.profiles?.email || "User"));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    supabase
      .from("typing_indicators")
      .upsert({
        conversation_id: conversationId,
        user_id: user?.id,
        started_at: new Date().toISOString(),
      })
      .then();

    typingTimeoutRef.current = setTimeout(() => {
      supabase
        .from("typing_indicators")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", user?.id)
        .then();
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      if (editingMessageId) {
        await supabase
          .from("messages")
          .update({
            content: newMessage,
            edited_at: new Date().toISOString(),
          })
          .eq("id", editingMessageId);
        setEditingMessageId(null);
      } else {
        const { error } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          content: newMessage,
          message_type: "text",
          parent_message_id: replyingTo?.id || null,
        });

        if (error) throw error;
      }

      setNewMessage("");
      setReplyingTo(null);
      
      // Clear typing indicator
      await supabase
        .from("typing_indicators")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", user?.id);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = (message: Message) => {
    setNewMessage(message.content);
    setEditingMessageId(message.id);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await supabase
        .from("messages")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      setMessages((current) => current.filter((msg) => msg.id !== messageId));
      toast({ title: "Message deleted" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handlePinMessage = async (messageId: string, currentPinned: boolean) => {
    try {
      await supabase
        .from("messages")
        .update({ is_pinned: !currentPinned })
        .eq("id", messageId);

      toast({
        title: currentPinned ? "Message unpinned" : "Message pinned",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pin message",
        variant: "destructive",
      });
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const reactions = message.reactions || [];
      const existingReaction = reactions.find(
        (r) => r.emoji === emoji && r.user_id === user?.id
      );

      let newReactions;
      if (existingReaction) {
        // Remove reaction
        newReactions = reactions.filter(
          (r) => !(r.emoji === emoji && r.user_id === user?.id)
        );
      } else {
        // Add reaction
        newReactions = [...reactions, { emoji, user_id: user?.id, count: 1 }];
      }

      await supabase
        .from("messages")
        .update({ reactions: newReactions })
        .eq("id", messageId);
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleForward = (message: Message) => {
    toast({
      title: "Forward message",
      description: "Select a conversation to forward this message to",
    });
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Recording stopped" : "Recording started",
      description: isRecording ? "Processing voice input..." : "Speak now",
    });
  };

  const handleSignLanguageInput = () => {
    toast({
      title: "Sign Language Input",
      description: "Camera-based sign language recognition will be available soon!",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/conversations")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="rounded-full bg-primary/10 p-2">
              <Hand className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">Conversation</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter((m) => m.is_pinned).length > 0 && (
          <Card className="bg-accent/50 p-3 sticky top-0 z-10">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="h-4 w-4" />
              <span className="text-sm font-semibold">Pinned Messages</span>
            </div>
            {messages
              .filter((m) => m.is_pinned)
              .map((msg) => (
                <p key={msg.id} className="text-xs truncate">
                  {msg.content}
                </p>
              ))}
          </Card>
        )}

        {messages.map((message) => {
          const isOwnMessage = message.sender_id === user?.id;
          const parentMessage = message.parent_message_id
            ? messages.find((m) => m.id === message.parent_message_id)
            : null;

          return (
            <div
              key={message.id}
              className={`flex group ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[70%]">
                {parentMessage && (
                  <div className="text-xs opacity-60 mb-1 px-2">
                    Replying to: {parentMessage.content.substring(0, 50)}...
                  </div>
                )}
                <Card
                  className={`p-3 ${
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm break-words">{message.content}</p>
                      {message.translation && (
                        <p className="text-xs mt-1 opacity-70 italic">
                          {message.translation}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs opacity-70">
                          {formatDistanceToNow(new Date(message.created_at))} ago
                        </p>
                        {message.edited_at && (
                          <span className="text-xs opacity-60">(edited)</span>
                        )}
                        {isOwnMessage && (
                          <span className="text-xs">
                            {message.is_read ? (
                              <CheckCheck className="h-3 w-3 inline" />
                            ) : (
                              <Check className="h-3 w-3 inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <MessageActions
                      isOwnMessage={isOwnMessage}
                      isPinned={message.is_pinned}
                      onReply={() => handleReply(message)}
                      onEdit={() => handleEditMessage(message)}
                      onDelete={() => handleDeleteMessage(message.id)}
                      onPin={() => handlePinMessage(message.id, message.is_pinned)}
                      onForward={() => handleForward(message)}
                    />
                  </div>
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(
                        message.reactions.reduce((acc: Record<string, number>, r) => {
                          acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]) => (
                        <Badge
                          key={emoji}
                          variant="secondary"
                          className="text-xs cursor-pointer"
                          onClick={() => handleReaction(message.id, emoji)}
                        >
                          {emoji} {count as number}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-1">
                    <EmojiPicker
                      onEmojiSelect={(emoji) => handleReaction(message.id, emoji)}
                    />
                  </div>
                </Card>
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <Card className="bg-muted p-2 px-3">
              <p className="text-xs text-muted-foreground">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </p>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <footer className="border-t bg-card p-4">
        <div className="container mx-auto max-w-4xl">
          {replyingTo && (
            <div className="flex items-center justify-between bg-accent/50 p-2 rounded-md mb-2">
              <div className="flex-1">
                <p className="text-xs font-semibold">Replying to:</p>
                <p className="text-sm truncate">{replyingTo.content}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {editingMessageId && (
            <div className="flex items-center justify-between bg-accent/50 p-2 rounded-md mb-2">
              <p className="text-xs font-semibold">Editing message</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingMessageId(null);
                  setNewMessage("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            {userMode === "deaf" ? (
              <Button
                variant="outline"
                size="icon"
                onClick={handleSignLanguageInput}
              >
                <Hand className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceInput}
                className={isRecording ? "bg-destructive text-destructive-foreground" : ""}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={
                editingMessageId
                  ? "Edit message..."
                  : replyingTo
                  ? "Type your reply..."
                  : userMode === "deaf"
                  ? "Type your message..."
                  : "Type or use voice..."
              }
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
