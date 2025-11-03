import { Brain, Mic, Zap, Target, Users, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import originalImage from '@assets/Screenshot_20251102_172247_X_1762133368500.jpg';

export function DelegationMindMap() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <Badge variant="default" className="mb-4" data-testid="badge-inspired">
          Inspired by Noemi Kis's Framework
        </Badge>
        <h2 className="text-4xl font-bold mb-4">How Deleg8te.ai Automates Better Delegation</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          What takes 15 minutes manually now happens in 30 seconds with voice + AI
        </p>
      </div>

      {/* Original Framework Reference */}
      <Card className="mb-12 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            The Manual Process (Before Deleg8te.ai)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <img 
            src={originalImage} 
            alt="How to Prioritize Like A Pro - Manual Framework by Noemi Kis" 
            className="w-full rounded-md"
            data-testid="img-original-framework"
          />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Source: @SilentStrength - Traditional prioritization requires 4 manual steps
          </p>
        </CardContent>
      </Card>

      {/* Mind Map - Deleg8te.ai's Automated Process */}
      <div className="relative">
        {/* Center Node - Voice Input */}
        <div className="flex justify-center mb-12">
          <Card className="w-80 bg-primary/10 border-primary" data-testid="card-center-node">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
                <Mic className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">You Speak</h3>
              <p className="text-sm text-muted-foreground mb-4">
                "I need Sarah to create a Q1 marketing strategy focused on enterprise clients by Friday"
              </p>
              <Badge variant="default" data-testid="badge-time">30 seconds</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center">
            <div className="h-12 w-0.5 bg-border"></div>
            <Sparkles className="w-6 h-6 text-primary" />
            <div className="h-12 w-0.5 bg-border"></div>
          </div>
        </div>

        {/* 4 Automated Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Step 1: Understand */}
          <Card className="hover-elevate" data-testid="card-step-understand">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                <Brain className="w-6 h-6 text-blue-500" />
              </div>
              <CardTitle className="text-lg">1. Understand</CardTitle>
              <Badge variant="outline" className="w-fit">AI-Powered</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Brain Dump</div>
                <p className="text-muted-foreground text-xs">Voice transcript captured</p>
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Categorize</div>
                <p className="text-muted-foreground text-xs">Auto-tagged as "Marketing"</p>
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Extract Context</div>
                <p className="text-muted-foreground text-xs">Target: Enterprise clients</p>
              </div>
              <div className="mt-4 p-2 bg-muted rounded text-xs">
                <strong>Manual:</strong> 3-4 minutes<br/>
                <strong>Deleg8te.ai:</strong> Instant
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Organize */}
          <Card className="hover-elevate" data-testid="card-step-organize">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <CardTitle className="text-lg">2. Organize</CardTitle>
              <Badge variant="outline" className="w-fit">Impact/Urgency AI</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Evaluate Impact</div>
                <p className="text-muted-foreground text-xs">High (Strategic initiative)</p>
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Evaluate Urgency</div>
                <p className="text-muted-foreground text-xs">High (Friday deadline)</p>
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Auto-Prioritize</div>
                <p className="text-muted-foreground text-xs">Action: "Do Now"</p>
              </div>
              <div className="mt-4 p-2 bg-muted rounded text-xs">
                <strong>Manual:</strong> 2-3 minutes<br/>
                <strong>Deleg8te.ai:</strong> Instant
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Delegate Decision */}
          <Card className="hover-elevate" data-testid="card-step-delegate">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <CardTitle className="text-lg">3. Decide</CardTitle>
              <Badge variant="outline" className="w-fit">Smart Matching</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Can Automate?</div>
                <p className="text-muted-foreground text-xs">No - needs strategy</p>
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Requires Expertise?</div>
                <p className="text-muted-foreground text-xs">Yes - marketing specialist</p>
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Best Match</div>
                <p className="text-muted-foreground text-xs">Sarah (Marketing Lead)</p>
              </div>
              <div className="mt-4 p-2 bg-muted rounded text-xs">
                <strong>Manual:</strong> 5-8 minutes<br/>
                <strong>Deleg8te.ai:</strong> Instant
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Execute */}
          <Card className="hover-elevate" data-testid="card-step-execute">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6 text-orange-500" />
              </div>
              <CardTitle className="text-lg">4. Execute</CardTitle>
              <Badge variant="outline" className="w-fit">SMART Goals</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ SMART Objectives</div>
                <p className="text-muted-foreground text-xs">Auto-generated</p>
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Break Down Tasks</div>
                <p className="text-muted-foreground text-xs">Actionable steps</p>
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">✓ Track Progress</div>
                <p className="text-muted-foreground text-xs">Real-time updates</p>
              </div>
              <div className="mt-4 p-2 bg-muted rounded text-xs">
                <strong>Manual:</strong> 3-5 minutes<br/>
                <strong>Deleg8te.ai:</strong> Instant
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final Result */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center">
              <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Task Delegated Successfully</h3>
              
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">Sarah</div>
                  <div className="text-sm font-medium">Assigned to</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">High/High</div>
                  <div className="text-sm font-medium">Impact/Urgency</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">Friday</div>
                  <div className="text-sm font-medium">Due Date</div>
                </div>
              </div>

              <div className="bg-card p-4 rounded-md text-left mb-6">
                <div className="text-xs font-medium text-muted-foreground mb-2">SMART OBJECTIVES GENERATED:</div>
                <ul className="text-sm space-y-1">
                  <li>✓ <strong>Specific:</strong> Create Q1 marketing strategy targeting enterprise clients</li>
                  <li>✓ <strong>Measurable:</strong> Include market analysis, 3 campaign ideas, budget allocation</li>
                  <li>✓ <strong>Achievable:</strong> Leverage existing enterprise research and team resources</li>
                  <li>✓ <strong>Relevant:</strong> Aligns with company's enterprise expansion goals</li>
                  <li>✓ <strong>Time-bound:</strong> Complete by Friday EOD</li>
                </ul>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm">
                <div>
                  <div className="text-destructive font-bold">Manual Process</div>
                  <div className="text-2xl">13-20 min</div>
                </div>
                <ArrowRight className="w-8 h-8 text-muted-foreground" />
                <div>
                  <div className="text-primary font-bold">Deleg8te.ai</div>
                  <div className="text-2xl">30 sec</div>
                </div>
              </div>
              
              <div className="mt-6">
                <Badge variant="default" className="text-lg px-6 py-2">
                  40x Faster Delegation
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Explanation */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold mb-4">The Difference?</h3>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Noemi Kis's framework is brilliant for understanding <em>how to think</em> about delegation.
            Deleg8te.ai takes that framework and <strong>automates every single step</strong> using voice recognition + AI.
            You get all the benefits of expert prioritization without the manual work.
          </p>
        </div>
      </div>
    </div>
  );
}
