import { DelegationMindMap } from '@/components/DelegationMindMap';
import { ProblemSolutionFlow } from '@/components/ProblemSolutionFlow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProblemFlowDemo() {
  return (
    <div className="min-h-screen bg-background p-6">
      <Tabs defaultValue="mindmap" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="mindmap" data-testid="tab-mindmap">Mind Map</TabsTrigger>
          <TabsTrigger value="comparison" data-testid="tab-comparison">Problem/Solution</TabsTrigger>
        </TabsList>
        <TabsContent value="mindmap">
          <DelegationMindMap />
        </TabsContent>
        <TabsContent value="comparison">
          <ProblemSolutionFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
