import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { Mic, Users, Brain, CheckCircle2, ArrowRight, TrendingUp, Zap, Clock, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export default function Landing() {
  const [, setLocation] = useLocation();

  // Check if user is already authenticated
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Deleg8te.ai</h1>
              <p className="text-xs text-muted-foreground">by WeighPay Group Inc.</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLogin} data-testid="link-signin">
              Sign In
            </Button>
            <Button size="sm" onClick={handleLogin} data-testid="button-get-started">
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-6 py-20 text-center">
        <Badge className="mb-6" variant="outline" data-testid="badge-price">
          <DollarSign className="h-3 w-3 mr-1" />
          Just $1/month/user
        </Badge>
        <h1 className="text-5xl font-bold mb-6 text-foreground">
          Voice-Powered Task Delegation
          <br />
          <span className="text-primary">Built for Executives</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Speak your tasks. AI analyzes, prioritizes, and delegates. 
          Track everything in real-time. Unlimited team members.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" onClick={handleLogin} data-testid="button-start-free">
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline" asChild data-testid="link-learn-more">
            <a href="#workflow">Learn More</a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          14-day free trial • No credit card needed • Cancel anytime
        </p>
      </section>

      {/* Workflow Flowchart Section */}
      <section id="workflow" className="container mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">How Deleg8te.ai Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From voice to completion in four intelligent steps
          </p>
        </div>

        {/* Flowchart Visual */}
        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Step 1: Voice Input */}
          <Card className="p-6 relative" data-testid="card-workflow-step-1">
            <div className="absolute -top-3 left-6">
              <Badge className="font-semibold">Step 1</Badge>
            </div>
            <div className="mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mic className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center text-foreground">Voice Dictate</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Speak your task naturally. Our AI captures every detail.
            </p>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong className="text-foreground">Example:</strong><br />
              "I need Sarah to prepare the Q1 marketing presentation by Friday..."
            </div>
            {/* Arrow */}
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
          </Card>

          {/* Step 2: AI Analysis */}
          <Card className="p-6 relative" data-testid="card-workflow-step-2">
            <div className="absolute -top-3 left-6">
              <Badge className="font-semibold bg-primary text-primary-foreground">Step 2</Badge>
            </div>
            <div className="mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center text-foreground">AI Analyzes</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Breaks down into SMART objectives and prioritizes by impact/urgency.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="flex-shrink-0">High Impact</Badge>
                <span className="text-muted-foreground">Urgent</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="flex-shrink-0">Specific</Badge>
                <span className="text-muted-foreground">Measurable</span>
              </div>
            </div>
            {/* Arrow */}
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
          </Card>

          {/* Step 3: Smart Delegation */}
          <Card className="p-6 relative" data-testid="card-workflow-step-3">
            <div className="absolute -top-3 left-6">
              <Badge className="font-semibold">Step 3</Badge>
            </div>
            <div className="mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center text-foreground">Delegate</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Assign to team members with instant in-app notifications.
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">SC</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">ER</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">MT</span>
              </div>
            </div>
            {/* Arrow */}
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
          </Card>

          {/* Step 4: Track & Complete */}
          <Card className="p-6 relative" data-testid="card-workflow-step-4">
            <div className="absolute -top-3 left-6">
              <Badge className="font-semibold">Step 4</Badge>
            </div>
            <div className="mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center text-foreground">Track Progress</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Monitor real-time updates and completion status.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">In Progress</span>
                <span className="text-foreground font-semibold">45%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[45%]"></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Workflow Summary */}
        <div className="mt-12 p-6 bg-muted rounded-lg text-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            <Clock className="inline h-5 w-5 mr-2" />
            Average delegation time: <span className="text-primary">30 seconds</span>
          </p>
          <p className="text-sm text-muted-foreground">
            From voice input to task assignment, fully automated with AI
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto max-w-7xl px-6 py-20 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Everything You Need</h2>
          <p className="text-lg text-muted-foreground">
            Enterprise-grade features at an incredible price
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6" data-testid="card-feature-voice">
            <Mic className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Voice-First Interface</h3>
            <p className="text-muted-foreground">
              Dictate tasks naturally. AI transcribes and analyzes in real-time with high accuracy.
            </p>
          </Card>

          <Card className="p-6" data-testid="card-feature-ai">
            <Brain className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">AI-Powered Analysis</h3>
            <p className="text-muted-foreground">
              Automatic SMART objective breakdown and impact/urgency matrix prioritization.
            </p>
          </Card>

          <Card className="p-6" data-testid="card-feature-team">
            <Users className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Unlimited Team Members</h3>
            <p className="text-muted-foreground">
              Add as many team members as you need. No per-seat pricing. Just $1/month.
            </p>
          </Card>

          <Card className="p-6" data-testid="card-feature-tracking">
            <TrendingUp className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Real-Time Tracking</h3>
            <p className="text-muted-foreground">
              Monitor task progress, completion rates, and team performance with live updates.
            </p>
          </Card>

          <Card className="p-6" data-testid="card-feature-alerts">
            <CheckCircle2 className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">In-App Alerts</h3>
            <p className="text-muted-foreground">
              Instant notifications for task assignments, updates, and completions.
            </p>
          </Card>

          <Card className="p-6" data-testid="card-feature-price">
            <DollarSign className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Unbeatable Value</h3>
            <p className="text-muted-foreground">
              Just $1/month/user via Stripe. Enterprise features without enterprise pricing.
            </p>
          </Card>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="container mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">How Deleg8te.ai Compares</h2>
          <p className="text-lg text-muted-foreground">
            Enterprise-grade compliance meets modern AI productivity
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Traditional Delegation Tools */}
          <Card className="p-8" data-testid="card-comparison-traditional">
            <h3 className="text-2xl font-bold mb-2 text-muted-foreground">Traditional Tools</h3>
            <p className="text-sm text-muted-foreground mb-6">Like iDelegate, Workday, others</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-red-600 dark:text-red-400">✗</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">7-180 days deployment</p>
                  <p className="text-sm text-muted-foreground">Long setup cycles, complex configuration</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-red-600 dark:text-red-400">✗</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">$10k-15k+ setup fees</p>
                  <p className="text-sm text-muted-foreground">One-time costs before monthly hosting</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-red-600 dark:text-red-400">✗</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Manual task entry</p>
                  <p className="text-sm text-muted-foreground">Type every field, no AI assistance</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-red-600 dark:text-red-400">✗</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Built for compliance only</p>
                  <p className="text-sm text-muted-foreground">Focuses on governance, not productivity</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">~</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Good audit trails</p>
                  <p className="text-sm text-muted-foreground">Strong compliance features</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Deleg8te.ai */}
          <Card className="p-8 bg-primary/5 border-primary" data-testid="card-comparison-delegatenow">
            <h3 className="text-2xl font-bold mb-2 text-primary">Deleg8te.ai</h3>
            <p className="text-sm text-muted-foreground mb-6">AI-powered productivity + compliance</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Instant deployment</p>
                  <p className="text-sm text-muted-foreground">Sign up and start delegating in minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">$1/month/user</p>
                  <p className="text-sm text-muted-foreground">No setup fees, simple per-user pricing</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Voice-powered AI</p>
                  <p className="text-sm text-muted-foreground">Speak naturally, AI creates SMART tasks</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Productivity + compliance</p>
                  <p className="text-sm text-muted-foreground">Get work done AND meet audit requirements</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Audit trails included</p>
                  <p className="text-sm text-muted-foreground">Formal acceptance, expiry tracking, spending limits</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-muted rounded-lg">
            <p className="text-4xl font-bold text-primary mb-2">1000x</p>
            <p className="text-sm text-muted-foreground">More affordable than traditional tools</p>
          </div>
          <div className="p-6 bg-muted rounded-lg">
            <p className="text-4xl font-bold text-primary mb-2">30 sec</p>
            <p className="text-sm text-muted-foreground">Average time to delegate a task</p>
          </div>
          <div className="p-6 bg-muted rounded-lg">
            <p className="text-4xl font-bold text-primary mb-2">0 days</p>
            <p className="text-sm text-muted-foreground">Setup time required</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto max-w-7xl px-6 py-20">
        <Card className="p-12 text-center bg-primary text-primary-foreground" data-testid="card-cta">
          <h2 className="text-4xl font-bold mb-4">Ready to Delegate Smarter?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join executives who save hours every week with voice-powered task delegation
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleLogin} data-testid="button-cta-start">
              Start Your Free Trial
            </Button>
          </div>
          <p className="text-sm mt-4 opacity-75">
            14-day free trial • No credit card needed • Then just $1/month/user
          </p>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Deleg8te.ai</p>
                <p className="text-xs text-muted-foreground">© 2024 WeighPay Group Inc.</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
