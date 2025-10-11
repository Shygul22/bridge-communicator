import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Hand, MessageCircle, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/home");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[image:var(--gradient-primary)] flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-white/20 backdrop-blur-sm p-8 shadow-[var(--shadow-hover)]">
              <Hand className="h-20 w-20 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
              SignBridge
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Breaking down communication barriers with real-time sign language translation
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white space-y-3">
              <Hand className="h-8 w-8 mx-auto" />
              <h3 className="font-semibold text-lg">Sign Recognition</h3>
              <p className="text-sm text-white/80">Advanced AI-powered sign language detection</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white space-y-3">
              <MessageCircle className="h-8 w-8 mx-auto" />
              <h3 className="font-semibold text-lg">Real-time Translation</h3>
              <p className="text-sm text-white/80">Instant voice and text conversion</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white space-y-3">
              <Users className="h-8 w-8 mx-auto" />
              <h3 className="font-semibold text-lg">Inclusive Design</h3>
              <p className="text-sm text-white/80">Built for everyone, accessible to all</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90 shadow-[var(--shadow-hover)] text-lg px-12"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/help")}
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm text-lg px-12"
            >
              Learn More
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-white/70 text-sm">
        <p>© 2025 SignBridge. Empowering communication for all.</p>
      </footer>
    </div>
  );
};

export default Index;
