import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const timePerSubjectData = [
  { subject: 'Physics', hours: 8.5 },
  { subject: 'Math', hours: 12.2 },
  { subject: 'Chemistry', hours: 6.8 },
  { subject: 'History', hours: 5.4 },
  { subject: 'English', hours: 4.2 }
];

const dailyStudyTimeData = [
  { day: 'Mon', hours: 3.5 },
  { day: 'Tue', hours: 4.2 },
  { day: 'Wed', hours: 2.8 },
  { day: 'Thu', hours: 5.1 },
  { day: 'Fri', hours: 3.9 },
  { day: 'Sat', hours: 6.2 },
  { day: 'Sun', hours: 4.5 }
];

const taskStatusData = [
  { name: 'Completed', value: 65, color: '#10b981' },
  { name: 'Pending', value: 25, color: '#f59e0b' },
  { name: 'Overdue', value: 10, color: '#ef4444' }
];

const Analytics = () => {
  const totalStudyHours = timePerSubjectData.reduce((sum, item) => sum + item.hours, 0);
  const goalCompletionRate = 78; // percentage
  const weeklyGoal = 40; // hours
  const actualHours = dailyStudyTimeData.reduce((sum, item) => sum + item.hours, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your academic progress and study patterns</p>
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
            <div className="text-2xl font-bold">{taskStatusData[0].value}%</div>
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
                <Tooltip formatter={(value) => [`${value}h`, 'Study Time']} />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                <Tooltip formatter={(value) => [`${value}h`, 'Study Time']} />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
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
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Monthly Reading Goal</span>
                <span className="text-sm text-muted-foreground">6 / 8 books</span>
              </div>
              <Progress value={75} className="h-2" />
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