import { ArrowRight, AlertCircle, Clock, Users, Target, Zap, Brain, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ProblemSolutionFlow() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Transform How You Delegate</h2>
        <p className="text-lg text-muted-foreground">
          From overwhelmed to organized in seconds
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Traditional Way - Problems */}
        <Card className="border-destructive/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="destructive" data-testid="badge-traditional">Traditional Way</Badge>
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>

            <div className="space-y-6">
              {/* Problem 1 */}
              <div className="flex gap-4" data-testid="problem-time-consuming">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Time-Consuming Process</h3>
                  <p className="text-sm text-muted-foreground">
                    Open email → Type details → Explain context → Follow up multiple times
                  </p>
                  <div className="mt-2 text-xs font-medium text-destructive">⏱️ 10-15 minutes per task</div>
                </div>
              </div>

              {/* Problem 2 */}
              <div className="flex gap-4" data-testid="problem-prioritization">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Manual Prioritization</h3>
                  <p className="text-sm text-muted-foreground">
                    Guess urgency → Estimate impact → Hope you're right → Reallocate later
                  </p>
                  <div className="mt-2 text-xs font-medium text-destructive">❌ 40% misalignment rate</div>
                </div>
              </div>

              {/* Problem 3 */}
              <div className="flex gap-4" data-testid="problem-scattered">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Scattered Communication</h3>
                  <p className="text-sm text-muted-foreground">
                    Email threads → Slack messages → Meeting notes → Lost context
                  </p>
                  <div className="mt-2 text-xs font-medium text-destructive">📉 60% context loss</div>
                </div>
              </div>

              {/* Problem 4 */}
              <div className="flex gap-4" data-testid="problem-unclear">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Unclear Objectives</h3>
                  <p className="text-sm text-muted-foreground">
                    Vague instructions → Misaligned execution → Rework required
                  </p>
                  <div className="mt-2 text-xs font-medium text-destructive">🔄 30% rework overhead</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DelegateNow Way - Solutions */}
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="default" data-testid="badge-delegatenow">The DelegateNow Way</Badge>
              <Zap className="w-5 h-5 text-primary" />
            </div>

            <div className="space-y-6">
              {/* Solution 1 */}
              <div className="flex gap-4" data-testid="solution-voice">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Voice-First Speed</h3>
                  <p className="text-sm text-muted-foreground">
                    Speak naturally → AI captures everything → Task created instantly
                  </p>
                  <div className="mt-2 text-xs font-medium text-primary">⚡ 30 seconds per task</div>
                </div>
              </div>

              {/* Solution 2 */}
              <div className="flex gap-4" data-testid="solution-ai-priority">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered Prioritization</h3>
                  <p className="text-sm text-muted-foreground">
                    Auto impact analysis → Urgency classification → Smart assignee suggestions
                  </p>
                  <div className="mt-2 text-xs font-medium text-primary">✅ 95% accuracy rate</div>
                </div>
              </div>

              {/* Solution 3 */}
              <div className="flex gap-4" data-testid="solution-centralized">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Centralized Hub</h3>
                  <p className="text-sm text-muted-foreground">
                    Single dashboard → Complete history → Real-time updates → Perfect context
                  </p>
                  <div className="mt-2 text-xs font-medium text-primary">📈 100% context retention</div>
                </div>
              </div>

              {/* Solution 4 */}
              <div className="flex gap-4" data-testid="solution-smart">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">SMART Objectives</h3>
                  <p className="text-sm text-muted-foreground">
                    Auto-generated goals → Clear success criteria → Measurable outcomes
                  </p>
                  <div className="mt-2 text-xs font-medium text-primary">🎯 Zero ambiguity</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Calculator */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">Your Time Savings</h3>
            <p className="text-muted-foreground">Average executive delegating 20 tasks per week</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center" data-testid="metric-time-saved">
              <div className="text-4xl font-bold text-primary mb-2">4.5 hrs</div>
              <div className="text-sm font-medium">Saved Per Week</div>
              <div className="text-xs text-muted-foreground mt-1">From 5 hours to 30 minutes</div>
            </div>

            <div className="text-center" data-testid="metric-productivity">
              <div className="text-4xl font-bold text-primary mb-2">30x</div>
              <div className="text-sm font-medium">Faster Delegation</div>
              <div className="text-xs text-muted-foreground mt-1">15 minutes → 30 seconds</div>
            </div>

            <div className="text-center" data-testid="metric-roi">
              <div className="text-4xl font-bold text-primary mb-2">$18k</div>
              <div className="text-sm font-medium">Annual Value</div>
              <div className="text-xs text-muted-foreground mt-1">At $200/hr executive rate</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              For just <span className="font-bold text-primary">$1/month</span> — 
              that's a <span className="font-bold">1,800,000% ROI</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Visual Flow Arrow */}
      <div className="mt-12 flex items-center justify-center gap-4 text-muted-foreground">
        <div className="text-sm font-medium">Traditional chaos</div>
        <ArrowRight className="w-6 h-6" />
        <div className="text-sm font-medium text-primary">Organized efficiency</div>
      </div>
    </div>
  );
}
