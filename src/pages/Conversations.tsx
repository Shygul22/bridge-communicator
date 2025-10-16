import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Hand, MessageSquare, ArrowLeft, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { OnlineUsers } from "@/components/OnlineUsers";

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  otherUserId: string;
}

const Conversations = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserSelection, setShowUserSelection] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant1_id.eq.${user?.id},participant2_id.eq.${user?.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      const conversationsWithOtherUser = data.map((conv) => ({
        ...conv,
        otherUserId: conv.participant1_id === user?.id ? conv.participant2_id : conv.participant1_id,
      }));

      setConversations(conversationsWithOtherUser);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `participant1_id=eq.${user?.id},participant2_id=eq.${user?.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleStartNewConversation = () => {
    setShowUserSelection(true);
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="rounded-full bg-[image:var(--gradient-primary)] p-2">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Conversations</h1>
          </div>
          <Dialog open={showUserSelection} onOpenChange={setShowUserSelection}>
            <DialogTrigger asChild>
              <Button onClick={handleStartNewConversation} size="icon">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
              </DialogHeader>
              <OnlineUsers />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {conversations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
            <p className="text-muted-foreground mb-6">
              Start a new conversation to connect with other users
            </p>
            <Dialog open={showUserSelection} onOpenChange={setShowUserSelection}>
              <DialogTrigger asChild>
                <Button onClick={handleStartNewConversation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Conversation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                <OnlineUsers />
              </DialogContent>
            </Dialog>
          </Card>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className="p-4 hover:shadow-[var(--shadow-soft)] transition-shadow cursor-pointer"
                onClick={() => navigate(`/chat/${conv.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Hand className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">User {conv.otherUserId.slice(0, 8)}</h3>
                    <p className="text-sm text-muted-foreground">
                      Last message {formatDistanceToNow(new Date(conv.last_message_at))} ago
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Conversations;
