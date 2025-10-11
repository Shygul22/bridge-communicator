import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  HelpCircle,
  Book,
  MessageCircle,
  Send,
  Video,
} from "lucide-react";

const Help = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      setContactForm({ name: "", email: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  const faqs = [
    {
      question: "How does sign language recognition work?",
      answer:
        "SignBridge uses advanced AI and computer vision to recognize hand gestures and translate them into text and speech in real-time. Simply position yourself in front of your camera and start signing.",
    },
    {
      question: "What sign languages are supported?",
      answer:
        "Currently, we support ASL (American Sign Language), BSL (British Sign Language), FSL (French Sign Language), and GSL (German Sign Language). More languages are being added regularly.",
    },
    {
      question: "Do I need special equipment?",
      answer:
        "No special equipment is needed! SignBridge works with any device that has a camera, including smartphones, tablets, and computers.",
    },
    {
      question: "How do I switch between Normal and Deaf user modes?",
      answer:
        "You can switch modes anytime by going to Settings and selecting your preferred mode. Normal mode is for hearing users who want to communicate with deaf individuals, while Deaf mode is optimized for deaf users.",
    },
    {
      question: "Is my video data stored or recorded?",
      answer:
        "No, we prioritize your privacy. Video is processed in real-time for translation only and is not stored or recorded on our servers.",
    },
    {
      question: "Can I use SignBridge offline?",
      answer:
        "Currently, SignBridge requires an internet connection for real-time AI translation. We're working on offline capabilities for basic features.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Help & Support</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 space-y-3 hover:shadow-[var(--shadow-soft)] transition-shadow cursor-pointer">
            <div className="rounded-full bg-primary/10 p-3 w-fit">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Getting Started</h3>
            <p className="text-sm text-muted-foreground">
              Learn the basics of using SignBridge
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:shadow-[var(--shadow-soft)] transition-shadow cursor-pointer">
            <div className="rounded-full bg-secondary/10 p-3 w-fit">
              <Video className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="font-semibold">Video Tutorials</h3>
            <p className="text-sm text-muted-foreground">
              Watch step-by-step guides
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:shadow-[var(--shadow-soft)] transition-shadow cursor-pointer">
            <div className="rounded-full bg-accent/10 p-3 w-fit">
              <HelpCircle className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold">FAQs</h3>
            <p className="text-sm text-muted-foreground">
              Find answers to common questions
            </p>
          </Card>
        </div>

        {/* FAQs */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        {/* Contact Support */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Contact Support</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Can't find what you're looking for? Send us a message and we'll help
            you out.
          </p>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="How can we help you?"
                rows={5}
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default Help;
