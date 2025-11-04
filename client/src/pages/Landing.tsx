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
        <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </span>
          •
          <span className="inline-flex items-center gap-1">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </span>
          •
          <span className="inline-flex items-center gap-1">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Apple
          </span>
          & more SSO options
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
