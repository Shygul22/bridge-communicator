import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email: string;
}

interface PresenceState {
  [key: string]: Array<{
    presence_ref: string;
    user_id: string;
    email: string;
  }>;
}

export const OnlineUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [onlineUsers, setOnlineUsers] = useState<Profile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch all profiles first
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id);
      
      if (data) {
        setProfiles(data);
      }
    };

    fetchProfiles();

    // Set up presence channel
    const channel = supabase.channel("online-users");

    channel
      .on("presence", { event: "sync" }, () => {
        const state: PresenceState = channel.presenceState();
        const users: Profile[] = [];
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            if (presence.user_id !== user.id) {
              users.push({
                id: presence.user_id,
                email: presence.email,
              });
            }
          });
        });
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track current user presence
          await channel.track({
            user_id: user.id,
            email: user.email || "Unknown",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const handleStartChat = async (otherUserId: string) => {
    if (!user) return;

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existingConversation) {
        navigate(`/chat/${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({
          participant1_id: user.id,
          participant2_id: otherUserId,
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/chat/${newConversation.id}`);
    } catch (error: any) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Users</h2>
      
      <div className="space-y-3">
        {profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No other users yet
          </p>
        ) : (
          profiles.map((profile) => {
            const isOnline = onlineUsers.some((u) => u.id === profile.id);
            
            return (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {profile.email[0].toUpperCase()}
                      </span>
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{profile.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleStartChat(profile.id)}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Button>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
