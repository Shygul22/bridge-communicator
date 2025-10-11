import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

interface UserPreferences {
  user_mode: string;
  preferred_language: string;
  preferred_sign_language: string;
  voice_enabled: boolean;
  vibration_enabled: boolean;
  captions_enabled: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({
    user_mode: "normal",
    preferred_language: "en",
    preferred_sign_language: "asl",
    voice_enabled: true,
    vibration_enabled: true,
    captions_enabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setPreferences(data);
      }
    } catch (error: any) {
      console.error("Error fetching preferences:", error);
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .update(preferences)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* User Mode */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">User Mode</h2>
            <p className="text-sm text-muted-foreground">
              Choose how you want to use SignBridge
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-mode">Communication Mode</Label>
            <Select
              value={preferences.user_mode}
              onValueChange={(value) =>
                setPreferences({ ...preferences, user_mode: value })
              }
            >
              <SelectTrigger id="user-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal User Mode</SelectItem>
                <SelectItem value="deaf">Deaf User Mode</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {preferences.user_mode === "normal"
                ? "Voice and text communication with sign language support"
                : "Sign language input with text and voice output"}
            </p>
          </div>
        </Card>

        {/* Language Settings */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Language Preferences</h2>
            <p className="text-sm text-muted-foreground">
              Customize your language settings
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={preferences.preferred_language}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, preferred_language: value })
                }
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign-language">Sign Language</Label>
              <Select
                value={preferences.preferred_sign_language}
                onValueChange={(value) =>
                  setPreferences({
                    ...preferences,
                    preferred_sign_language: value,
                  })
                }
              >
                <SelectTrigger id="sign-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asl">ASL (American Sign Language)</SelectItem>
                  <SelectItem value="bsl">BSL (British Sign Language)</SelectItem>
                  <SelectItem value="fsl">FSL (French Sign Language)</SelectItem>
                  <SelectItem value="gsl">GSL (German Sign Language)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Accessibility Settings */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">
              Accessibility Features
            </h2>
            <p className="text-sm text-muted-foreground">
              Toggle features to customize your experience
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="voice">Voice Output</Label>
                <p className="text-xs text-muted-foreground">
                  Enable text-to-speech for translations
                </p>
              </div>
              <Switch
                id="voice"
                checked={preferences.voice_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, voice_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="vibration">Haptic Feedback</Label>
                <p className="text-xs text-muted-foreground">
                  Vibration alerts for important events
                </p>
              </div>
              <Switch
                id="vibration"
                checked={preferences.vibration_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, vibration_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="captions">Live Captions</Label>
                <p className="text-xs text-muted-foreground">
                  Show real-time text captions
                </p>
              </div>
              <Switch
                id="captions"
                checked={preferences.captions_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, captions_enabled: checked })
                }
              />
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Account</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account settings
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
          </div>
        </Card>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-background pt-4 pb-8">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="w-full"
          >
            {isSaving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
