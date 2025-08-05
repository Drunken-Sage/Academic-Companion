import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";
import { Plus } from "lucide-react";

interface StudySession {
  id: string;
  subject: string;
  duration_minutes: number;
  session_date: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  subject: string;
  due_date: string;
}

const Analytics = () => {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userCourses, setUserCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    subject: '',
    duration_minutes: '',
    session_date: format(new Date(), 'yyyy-MM-dd')
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch study sessions for the last 30 days
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const { data: sessions } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('session_date', thirtyDaysAgo)
          .order('session_date', { ascending: true });

        // Fetch all tasks
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Fetch user courses for filtering
        const { data: coursesData } = await supabase
          .from('user_courses')
          .select('course_name')
          .eq('user_id', user.id);

        const courseNames = coursesData?.map(course => course.course_name) || [];
        setUserCourses(courseNames);

        setStudySessions(sessions || []);
        setTasks(tasksData || []);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const createStudySession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!newSession.subject || !newSession.duration_minutes) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          subject: newSession.subject,
          duration_minutes: parseInt(newSession.duration_minutes),
          session_date: newSession.session_date
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Study session created successfully"
        });

        // Reset form
        setNewSession({
          subject: '',
          duration_minutes: '',
          session_date: format(new Date(), 'yyyy-MM-dd')
        });
        setIsSessionDialogOpen(false);

        // Refresh data
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const { data: sessions } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('session_date', thirtyDaysAgo)
          .order('session_date', { ascending: true });

        setStudySessions(sessions || []);
      }
    } catch (error) {
      console.error('Error creating study session:', error);
      toast({
        title: "Error",
        description: "Failed to create study session",
        variant: "destructive"
      });
    }
  };

  // Calculate analytics data - filter by user courses if available
  const timePerSubjectData = studySessions.reduce((acc, session) => {
    // Only include sessions for user's courses, or all if no courses defined
    if (userCourses.length === 0 || userCourses.includes(session.subject)) {
      const existing = acc.find(item => item.subject === session.subject);
      if (existing) {
        existing.hours += session.duration_minutes / 60;
      } else {
        acc.push({ subject: session.subject, hours: session.duration_minutes / 60 });
      }
    }
    return acc;
  }, [] as { subject: string; hours: number }[]);

  // Get current week study data
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const currentWeekSessions = studySessions.filter(session => {
    const sessionDate = new Date(session.session_date);
    return sessionDate >= weekStart && sessionDate <= weekEnd;
  });

  const dailyStudyTimeData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dayName = format(date, 'EEE');
    const dayString = format(date, 'yyyy-MM-dd');

    const dayHours = currentWeekSessions
      .filter(session => session.session_date === dayString)
      .reduce((sum, session) => sum + session.duration_minutes / 60, 0);

    return { day: dayName, hours: Number(dayHours.toFixed(1)) };
  });

  // Calculate task statistics
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const overdueTasks = tasks.filter(task => {
    const dueDate = new Date(task.due_date);
    return task.status !== 'completed' && dueDate < new Date();
  }).length;

  const totalTasks = tasks.length;
  const taskStatusData = totalTasks > 0 ? [
    { name: 'Completed', value: Math.round((completedTasks / totalTasks) * 100), color: 'hsl(var(--chart-1))' },
    { name: 'Pending', value: Math.round((pendingTasks / totalTasks) * 100), color: 'hsl(var(--chart-2))' },
    { name: 'Overdue', value: Math.round((overdueTasks / totalTasks) * 100), color: 'hsl(var(--chart-3))' }
  ] : [];

  const totalStudyHours = timePerSubjectData.reduce((sum, item) => sum + item.hours, 0);
  const weeklyGoal = 40; // hours
  const actualHours = dailyStudyTimeData.reduce((sum, item) => sum + item.hours, 0);
  const goalCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Loading your analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your academic progress and study patterns</p>
        </div>
        <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Study Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={newSession.subject}
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {userCourses.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                    {userCourses.length === 0 && (
                      <>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={newSession.duration_minutes}
                  onChange={(e) => setNewSession(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  placeholder="e.g., 60"
                />
              </div>
              <div>
                <Label htmlFor="date">Session Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newSession.session_date}
                  onChange={(e) => setNewSession(prev => ({ ...prev, session_date: e.target.value }))}
                  min={format(startOfWeek(new Date()), 'yyyy-MM-dd')}
                  max={format(endOfWeek(new Date()), 'yyyy-MM-dd')}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={createStudySession} className="flex-1">
                  Create Session
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSessionDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Study Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudyHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(actualHours / 7).toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStatusData.length > 0 ? taskStatusData[0].value : 0}%</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((actualHours / weeklyGoal) * 100)}%</div>
            <p className="text-xs text-muted-foreground">{actualHours}h / {weeklyGoal}h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Time per Subject Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Study Time by Subject</CardTitle>
            <p className="text-sm text-muted-foreground">Hours spent this week</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timePerSubjectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}h`, 'Study Time']} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {timePerSubjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Study Time Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Study Time</CardTitle>
            <p className="text-sm text-muted-foreground">This week's study pattern</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStudyTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}h`, 'Study Time']} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">Current task distribution</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {taskStatusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
            {taskStatusData.length === 0 && (
              <p className="text-center text-muted-foreground mt-4">No task data available</p>
            )}
          </CardContent>
        </Card>

        {/* Goal Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Completion Rate</CardTitle>
            <p className="text-sm text-muted-foreground">Weekly and monthly progress</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Weekly Study Goal</span>
                <span className="text-sm text-muted-foreground">
                  {actualHours}h / {weeklyGoal}h
                </span>
              </div>
              <Progress
                value={(actualHours / weeklyGoal) * 100}
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Task Completion</span>
                <span className="text-sm text-muted-foreground">{goalCompletionRate}%</span>
              </div>
              <Progress value={goalCompletionRate} className="h-2" />
            </div>


            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{goalCompletionRate}%</div>
                <p className="text-sm text-muted-foreground">Overall completion rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;