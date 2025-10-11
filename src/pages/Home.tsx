import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Hand,
  Video,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Mic,
  MessageSquare,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [userMode, setUserMode] = useState<string>("normal");
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserMode(data.user_mode);
      }
    } catch (error: any) {
      console.error("Error fetching preferences:", error);
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const handleStartConversation = () => {
    toast({
      title: "Coming Soon",
      description: "Camera-based sign language recognition will be available soon!",
    });
  };

  if (loading || isLoadingPrefs) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[image:var(--gradient-primary)] p-2">
              <Hand className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">SignBridge</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <SettingsIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/help")}>
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Mode indicator */}
        <div className="mb-8">
          <Card className="p-4 bg-[image:var(--gradient-secondary)] text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Current Mode</p>
                <p className="text-xl font-bold capitalize">{userMode} User</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/settings")}
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                Change Mode
              </Button>
            </div>
          </Card>
        </div>

        {/* Camera/Conversation Area */}
        <div className="space-y-6">
          <Card className="p-8 text-center space-y-6">
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
              <div className="text-center space-y-4">
                <Video className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  {userMode === "deaf"
                    ? "Position yourself in front of the camera to start signing"
                    : "Camera will activate when you start a conversation"}
                </p>
              </div>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full max-w-xs mx-auto"
              onClick={handleStartConversation}
            >
              <Hand className="mr-2 h-5 w-5" />
              Start Conversation
            </Button>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6 space-y-3 hover:shadow-[var(--shadow-soft)] transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Voice Translation</h3>
                  <p className="text-sm text-muted-foreground">
                    Convert speech to sign language
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-3 hover:shadow-[var(--shadow-soft)] transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-secondary/10 p-3">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">Text Translation</h3>
                  <p className="text-sm text-muted-foreground">
                    Type to communicate
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
