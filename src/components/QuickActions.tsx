import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, FileText, BarChart3, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const QuickActions = () => {
  const actions = [
    {
      title: "Create Study Session",
      description: "Track your study time and subjects",
      icon: Plus,
      href: "/analytics",
      color: "blue"
    },
    {
      title: "Add New Note",
      description: "Capture your thoughts and ideas",
      icon: FileText,
      href: "/notes",
      color: "green"
    },
    {
      title: "Manage Tasks",
      description: "Organize your academic tasks",
      icon: Calendar,
      href: "/tasks",
      color: "purple"
    },
    {
      title: "View Analytics",
      description: "Track your academic progress",
      icon: BarChart3,
      href: "/analytics",
      color: "orange"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Quick{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Actions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Jump straight into your academic workflow with these handy shortcuts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map((action, index) => (
            <Card key={index} className="group hover:shadow-card transition-all duration-300 hover:scale-105 border-border/50">
              <CardHeader className="text-center pb-4">
                <div className={`w-12 h-12 mx-auto rounded-xl bg-${action.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform mb-4`}>
                  <action.icon className={`h-6 w-6 text-${action.color}-500`} />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="text-sm">{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild className="w-full" variant="outline">
                  <Link to={action.href}>
                    Get Started
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActions;