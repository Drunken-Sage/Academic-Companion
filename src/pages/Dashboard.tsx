import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
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
  BarChart3,
  LogOut
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

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  major: string | null;
  weekly_study_goal: number | null;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Real data from Supabase
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [showAllSessions, setShowAllSessions] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session?.user) {
          navigate('/auth');
        } else {
          // Fetch user profile and data after authentication
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            fetchUserData(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        navigate('/auth');
      } else {
        fetchUserProfile(session.user.id);
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          await createUserProfile(userId);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      } else {
        const formattedTasks: Task[] = tasksData.map(task => ({
          id: task.id,
          title: task.title,
          completed: task.status === 'completed',
          priority: task.priority as 'high' | 'medium' | 'low',
          dueDate: new Date(task.due_date),
          category: task.subject
        }));
        setTasks(formattedTasks);
      }

      // Fetch study sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
        .limit(10);

      if (sessionsError) {
        console.error('Error fetching study sessions:', sessionsError);
      } else {
        const formattedSessions: StudySession[] = sessionsData.map(session => ({
          id: session.id,
          subject: session.subject,
          duration: session.duration_minutes,
          date: new Date(session.session_date)
        }));
        setStudySessions(formattedSessions);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            display_name: user?.email || 'Student',
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive"
        });
      } else {
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-task':
        navigate('/tasks');
        toast({
          title: "Add New Task",
          description: "Redirecting to tasks page...",
        });
        break;
      case 'start-session':
        toast({
          title: "Study Session Started",
          description: "Timer started! Focus mode activated.",
        });
        break;
      case 'create-note':
        navigate('/notes');
        toast({
          title: "Create Note",
          description: "Redirecting to notes page...",
        });
        break;
      case 'create-study-session':
        navigate('/analytics');
        toast({
          title: "Create Study Session",
          description: "Redirecting to analytics page...",
        });
        break;
      default:
        toast({
          title: "Feature",
          description: "This feature is being developed.",
        });
    }
  };

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
  // Use weekly_study_goal from profile (in hours), convert to minutes, fallback to 20 hours
  const weeklyGoalHours = profile?.weekly_study_goal || 20;
  const weeklyGoal = weeklyGoalHours * 60; // Convert hours to minutes
  const progressPercentage = Math.min((totalStudyTime / weeklyGoal) * 100, 100);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'todo';
      case 'low': return 'organizer';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

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
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{profile?.display_name || user.email}</p>
                <p className="text-muted-foreground">{profile?.major || 'Student'}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
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
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('add-task')}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Add New Task
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('create-note')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Note
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('create-study-session')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Create Study Session
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Study Statistics */}
        <Card className="lg:col-span-2 bg-background/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Study Statistics
            </CardTitle>
            <CardDescription>
              Recent study sessions and subject breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {studySessions.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No study sessions yet</p>
                <p className="text-sm text-muted-foreground">Start tracking your study time!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-accent/50">
                    <div className="text-2xl font-bold text-primary">
                      {studySessions.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Sessions This Week</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-accent/50">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(totalStudyTime / 60)}h
                    </div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">
                      {showAllSessions ? 'All Sessions' : 'Recent Sessions'}
                    </h4>
                    {studySessions.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllSessions(!showAllSessions)}
                        className="text-xs h-auto p-1"
                      >
                        {showAllSessions ? 'Show Less' : 'Show All'}
                      </Button>
                    )}
                  </div>
                  <div className={`space-y-2 ${showAllSessions ? 'max-h-64 overflow-y-auto' : ''}`}>
                    {(showAllSessions ? studySessions : studySessions.slice(0, 3)).map((session) => (
                      <div key={session.id} className="flex justify-between items-center p-2 rounded border">
                        <div>
                          <p className="font-medium text-sm">{session.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(session.date, 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {session.duration}min
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
};

export default Dashboard;