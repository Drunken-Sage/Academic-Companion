import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, CheckSquare, BarChart3, FileText, Calendar, Target } from "lucide-react";

const Features = () => {
  const mainFeatures = [
    {
      icon: FolderOpen,
      title: "Smart File Organizer",
      description: "Automatically categorize and organize your academic files with AI-powered tagging and intelligent folder structures.",
      color: "organizer",
      features: ["AI-powered categorization", "Smart search", "Cloud sync", "Version control"]
    },
    {
      icon: CheckSquare,
      title: "Calendar-Integrated To-Do Lists",
      description: "Manage your academic tasks with calendar integration, smart prioritization, and deadline tracking.",
      color: "red-500",
      features: ["Calendar integration", "Smart prioritization", "Deadline alerts", "Progress tracking"]
    },
    {
      icon: BarChart3,
      title: "Academic Analytics",
      description: "Track your productivity, study patterns, and academic progress with detailed insights and reports.",
      color: "blue-500",
      features: ["Study time tracking", "Performance insights", "Habit analysis", "Progress reports"]
    }
  ];

  const secondaryFeatures = [
    { icon: FileText, title: "Note Integration", description: "Connect with your favorite note-taking apps" },
    { icon: Calendar, title: "Schedule Sync", description: "Integrate with your calendar for seamless planning" },
    { icon: Target, title: "Goal Tracking", description: "Set and monitor your academic objectives" }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-card">
      <div className="container space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">
            Everything You Need to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed specifically for students and academics to enhance productivity and organization.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-8">
          {mainFeatures.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden bg-background/50 backdrop-blur border-border/50 hover:shadow-card transition-all duration-300 hover:scale-105 group">
              <CardHeader className="space-y-4">
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                </div>
                <div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {secondaryFeatures.map((feature, index) => (
            <Card key={index} className="text-center p-6 bg-background/30 border-border/50 hover:bg-background/50 transition-colors">
              <feature.icon className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;