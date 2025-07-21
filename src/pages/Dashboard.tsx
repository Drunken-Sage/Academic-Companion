import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard,
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calendar,
  FileText,
  Target,
  Plus,
  BookOpen,
  Users,
  Award,
  Activity,
  BarChart3
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate: Date;
  category: string;
}

interface StudySession {
  id: string;
  subject: string;
  duration: number;
  date: Date;
}

const Dashboard = () => {
  // Mock data
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete Math Assignment Chapter 5',
      completed: false,
      priority: 'high',
      dueDate: new Date(2024, 11, 24),
      category: 'Mathematics'
    },
    {
      id: '2',
      title: 'Read Computer Science Research Paper',
      completed: true,
      priority: 'medium',
      dueDate: new Date(2024, 11, 23),
      category: 'Computer Science'
    },
    {
      id: '3',
      title: 'Prepare Physics Lab Report',
      completed: false,
      priority: 'medium',
      dueDate: new Date(2024, 11, 25),
      category: 'Physics'
    },
    {
      id: '4',
      title: 'Study Group Meeting - History',
      completed: false,
      priority: 'low',
      dueDate: new Date(2024, 11, 26),
      category: 'History'
    }
  ]);

  const [studySessions] = useState<StudySession[]>([
    { id: '1', subject: 'Mathematics', duration: 120, date: new Date(2024, 11, 21) },
    { id: '2', subject: 'Physics', duration: 90, date: new Date(2024, 11, 21) },
    { id: '3', subject: 'Computer Science', duration: 150, date: new Date(2024, 11, 22) },
    { id: '4', subject: 'History', duration: 60, date: new Date(2024, 11, 22) },
  ]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());
    return eachDayOfInterval({ start, end });
  }, []);

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const todayTasks = tasks.filter(task => isSameDay(task.dueDate, new Date()));
  const overdueTasks = tasks.filter(task => task.dueDate < new Date() && !task.completed);

  const totalStudyTime = studySessions.reduce((total, session) => total + session.duration, 0);
  const weeklyGoal = 1200; // 20 hours in minutes
  const progressPercentage = Math.min((totalStudyTime / weeklyGoal) * 100, 100);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'todo';
      case 'low': return 'organizer';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your academic progress overview.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                JS
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">John Student</p>
              <p className="text-muted-foreground">Computer Science</p>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-background/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {completedTasks.length} completed, {pendingTasks.length} pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(totalStudyTime / 60)}h</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                Due today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Task completion
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Weekly Progress */}
          <Card className="lg:col-span-2 bg-background/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Weekly Study Goal
              </CardTitle>
              <CardDescription>
                Track your study hours and reach your weekly target
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {Math.round(totalStudyTime / 60)} of {Math.round(weeklyGoal / 60)} hours
                </span>
                <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              
              {/* Week Overview */}
              <div className="grid grid-cols-7 gap-2 mt-6">
                {weekDays.map((day) => {
                  const dayStudyTime = studySessions
                    .filter(session => isSameDay(session.date, day))
                    .reduce((total, session) => total + session.duration, 0);
                  
                  return (
                    <div key={day.toString()} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        {format(day, 'EEE')}
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mx-auto ${
                        isToday(day) 
                          ? 'bg-primary text-primary-foreground' 
                          : dayStudyTime > 0 
                            ? 'bg-accent text-accent-foreground' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {dayStudyTime > 0 ? `${Math.round(dayStudyTime / 60)}h` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-background/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Add New Task
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Start Study Session
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Create Note
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Event
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Tasks */}
          <Card className="bg-background/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Recent Tasks
              </CardTitle>
              <CardDescription>
                Your upcoming and overdue assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueTasks.length > 0 && (
                  <div className="border-l-4 border-destructive pl-4 py-2 bg-destructive/5 rounded-r">
                    <p className="text-sm font-medium text-destructive mb-2">Overdue Tasks</p>
                    {overdueTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-destructive rounded-full" />
                        <span className="text-sm">{task.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {pendingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-muted-foreground rounded" />
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {format(task.dueDate, 'MMM d')} • {task.category}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Statistics */}
          <Card className="bg-background/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Study Statistics
              </CardTitle>
              <CardDescription>
                Your study patterns and subject breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Mathematics', 'Computer Science', 'Physics', 'History'].map((subject) => {
                  const subjectTime = studySessions
                    .filter(session => session.subject === subject)
                    .reduce((total, session) => total + session.duration, 0);
                  const percentage = totalStudyTime > 0 ? (subjectTime / totalStudyTime) * 100 : 0;
                  
                  return (
                    <div key={subject} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{subject}</span>
                        <span className="text-muted-foreground">
                          {Math.round(subjectTime / 60)}h ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-1" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;