import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Hand, Mail, Lock, ArrowLeft } from "lucide-react";

type AuthMode = "signin" | "signup" | "forgot";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/home");
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
      navigate("/home");
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "You can now sign in.",
      });
      setMode("signin");
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setMode("signin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[image:var(--gradient-primary)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Button>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-[var(--shadow-hover)] p-8 space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center rounded-full bg-[image:var(--gradient-primary)] p-4">
              <Hand className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {mode === "signin" && "Welcome back"}
              {mode === "signup" && "Create account"}
              {mode === "forgot" && "Reset password"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "signin" && "Sign in to continue"}
              {mode === "signup" && "Get started with SignBridge"}
              {mode === "forgot" && "We'll send you a reset link"}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={
              mode === "signin"
                ? handleSignIn
                : mode === "signup"
                ? handleSignUp
                : handleForgotPassword
            }
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="inline h-4 w-4 mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : mode === "signup" ? (
                "Create Account"
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          {/* Mode switcher */}
          <div className="text-center text-sm space-y-2">
            {mode === "signin" && (
              <>
                <button
                  onClick={() => setMode("forgot")}
                  className="text-primary hover:underline block w-full"
                >
                  Forgot password?
                </button>
                <div>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}
            {mode === "signup" && (
              <div>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign in
                </button>
              </div>
            )}
            {mode === "forgot" && (
              <button
                onClick={() => setMode("signin")}
                className="text-primary hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
