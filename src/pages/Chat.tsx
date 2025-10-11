import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Mic, Video, Hand } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  translation: string | null;
  created_at: string;
  is_read: boolean;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && conversationId) {
      fetchUserPreferences();
      fetchMessages();
      subscribeToMessages();
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
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
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
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user?.id,
        content: newMessage,
        message_type: "text",
      });

      if (error) throw error;

      setNewMessage("");
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === user?.id ? "justify-end" : "justify-start"
            }`}
          >
            <Card
              className={`max-w-[70%] p-3 ${
                message.sender_id === user?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card"
              }`}
            >
              <p className="text-sm break-words">{message.content}</p>
              {message.translation && (
                <p className="text-xs mt-1 opacity-70 italic">{message.translation}</p>
              )}
              <p className="text-xs mt-1 opacity-70">
                {formatDistanceToNow(new Date(message.created_at))} ago
              </p>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="border-t bg-card p-4">
        <div className="container mx-auto max-w-4xl">
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
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={
                userMode === "deaf"
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
