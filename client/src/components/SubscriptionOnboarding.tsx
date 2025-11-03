import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  Crown, 
  Users, 
  Brain, 
  Mic, 
  Zap,
  Loader2 
} from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionData {
  subscriptionId: string;
  clientSecret: string | null;
  status: string;
}

function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Active!",
          description: "Welcome to DelegateNow Executive Plan",
        });
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        data-testid="button-complete-subscription"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Crown className="mr-2 h-4 w-4" />
            Start Executive Plan - $1/month/user
          </>
        )}
      </Button>
    </form>
  );
}

export function SubscriptionOnboarding({ open, onOpenChange }: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<'welcome' | 'payment'>('welcome');
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  const createSubscription = useMutation({
    mutationFn: async () => {
      return await apiRequest<SubscriptionData>("POST", "/api/subscription/create");
    },
    onSuccess: (data) => {
      if (data.status === 'active' || data.status === 'trialing') {
        // Already has active subscription
        toast({
          title: "Already Subscribed",
          description: "You already have an active subscription!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        onOpenChange(false);
      } else if (data.clientSecret) {
        // Need payment
        setSubscriptionData(data);
        setStep('payment');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const handleStartTrial = () => {
    createSubscription.mutate();
  };

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-subscription-onboarding">
        {step === 'welcome' ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">Welcome to DelegateNow!</DialogTitle>
                  <DialogDescription>
                    Start your Executive Plan to unlock all features
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Pricing Card */}
              <Card className="p-6 bg-primary/5 border-primary" data-testid="card-pricing">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Crown className="h-6 w-6 text-primary" />
                      Executive Plan
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      Everything you need to delegate like a pro
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">$1</div>
                    <div className="text-sm text-muted-foreground">per month/user</div>
                  </div>
                </div>
                <Badge variant="default" className="mb-4" data-testid="badge-trial">
                  14-day free trial • No credit card needed • Then $1/month/user
                </Badge>
              </Card>

              {/* Features Grid */}
              <div className="grid gap-3">
                <div className="flex items-start gap-3" data-testid="feature-voice">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mic className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Voice-First Delegation</h4>
                    <p className="text-sm text-muted-foreground">
                      Speak your tasks naturally. AI transcribes and analyzes instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3" data-testid="feature-ai">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">AI-Powered Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatic SMART objectives and impact/urgency prioritization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3" data-testid="feature-team">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Unlimited Team Members</h4>
                    <p className="text-sm text-muted-foreground">
                      Add as many team members as you need. No per-seat pricing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3" data-testid="feature-tracking">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Real-Time Tracking</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor progress, completion rates, and team performance live.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-3 pt-4">
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={handleStartTrial}
                  disabled={createSubscription.isPending}
                  data-testid="button-start-trial"
                >
                  {createSubscription.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>Start 14-Day Free Trial</>
                  )}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-skip"
                >
                  Skip for Now
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                No credit card required for trial • Cancel anytime • Powered by Stripe
              </p>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Subscription</DialogTitle>
              <DialogDescription>
                Add your payment details to activate your Executive Plan
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {subscriptionData?.clientSecret && (
                <Elements 
                  stripe={stripePromise}
                  options={{
                    clientSecret: subscriptionData.clientSecret,
                    appearance: {
                      theme: 'stripe',
                    },
                  }}
                >
                  <PaymentForm onSuccess={handlePaymentSuccess} />
                </Elements>
              )}
            </div>

            <Button 
              variant="ghost" 
              onClick={() => setStep('welcome')}
              data-testid="button-back"
            >
              Back
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
