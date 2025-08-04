import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';
import { Plus, Search, Filter, Edit, Trash2, CheckCircle, Clock, AlertCircle, Calendar, CalendarIcon } from "lucide-react";
import { format, isSameDay, startOfDay } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
}

// Subjects will be loaded from user courses
const priorities = ['All', 'low', 'medium', 'high'];

const Tasks = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subject: '',
    priority: 'medium' as Task['priority'],
    dueDate: ''
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication and fetch tasks
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      await fetchTasks(session.user.id);
      await fetchUserCourses(session.user.id);
      setLoading(false);
    };

    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          navigate('/auth');
        } else {
          setUser(session.user);
          await fetchTasks(session.user.id);
          await fetchUserCourses(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchTasks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Error fetching tasks",
          description: error.message,
          variant: "destructive"
        });
      } else {
        const formattedTasks: Task[] = data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          subject: task.subject,
          status: task.status as Task['status'],
          priority: task.priority as Task['priority'],
          dueDate: task.due_date,
          createdAt: new Date(task.created_at).toISOString().split('T')[0]
        }));
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUserCourses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select('course_name')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching courses:', error);
      } else {
        const courseNames = data.map(course => course.course_name);
        setSubjects(['All', ...courseNames]);
        
        // If no courses, provide default subjects
        if (courseNames.length === 0) {
          setSubjects(['All', 'General', 'Assignment', 'Project']);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setSubjects(['All', 'General', 'Assignment', 'Project']);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || task.subject === selectedSubject;
    const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;

    return matchesSearch && matchesSubject && matchesPriority;
  });

  const tasksByStatus = {
    pending: filteredTasks.filter(task => task.status === 'pending'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    completed: filteredTasks.filter(task => task.status === 'completed')
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const statusOrder: Task['status'][] = ['pending', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: nextStatus })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error updating task",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, status: nextStatus } : t
        ));
        toast({
          title: "Task updated",
          description: `Task marked as ${nextStatus.replace('-', ' ')}.`,
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error deleting task",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        toast({
          title: "Task deleted",
          description: "Task has been successfully deleted.",
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const addTask = async () => {
    if (!newTask.title || !newTask.subject || !newTask.dueDate || !user) return;
    if (new Date(newTask.dueDate) < new Date()) {
      toast({
        title: "Invalid Due Date",
        description: "Due date cannot be in the past.",
        variant: "destructive"
      });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.id,
            title: newTask.title,
            description: newTask.description,
            subject: newTask.subject,
            priority: newTask.priority,
            due_date: newTask.dueDate,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error creating task",
          description: error.message,
          variant: "destructive"
        });
      } else {
        const formattedTask: Task = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          subject: data.subject,
          status: data.status as Task['status'],
          priority: data.priority as Task['priority'],
          dueDate: data.due_date,
          createdAt: new Date(data.created_at).toISOString().split('T')[0]
        };
        
        setTasks(prev => [formattedTask, ...prev]);
        setNewTask({ title: '', description: '', subject: '', priority: 'medium', dueDate: '' });
        setIsDialogOpen(false);
        toast({
          title: "Task created",
          description: "Your new task has been added successfully.",
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{task.title}</h3>
              {getPriorityIcon(task.priority)}
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                {task.priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Subject: {task.subject}</span>
              <span>Due: {task.dueDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm" onClick={() => toggleTaskStatus(task.id)}>
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
          <p>Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const getDayTasks = (date: Date): Task[] => {
    return tasks.filter(task => isSameDay(new Date(task.dueDate), date));
  };

  const getDaysWithTasks = (): Date[] => {
    return tasks.map(task => startOfDay(new Date(task.dueDate)));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks & Calendar</h1>
          <p className="text-muted-foreground">Manage your tasks and view them in calendar format</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={newTask.subject} onValueChange={(value) => setNewTask(prev => ({ ...prev, subject: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.slice(1).map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value: Task['priority']) => setNewTask(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <Button onClick={addTask} className="w-full">Add Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorities.map(priority => (
              <SelectItem key={priority} value={priority}>
                {priority === 'All' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({tasksByStatus.pending.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({tasksByStatus['in-progress'].length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({tasksByStatus.completed.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {filteredTasks.map(task => <TaskCard key={task.id} task={task} />)}
        </TabsContent>
        
        <TabsContent value="pending">
          {tasksByStatus.pending.map(task => <TaskCard key={task.id} task={task} />)}
        </TabsContent>
        
        <TabsContent value="in-progress">
          {tasksByStatus['in-progress'].map(task => <TaskCard key={task.id} task={task} />)}
        </TabsContent>
        
        <TabsContent value="completed">
          {tasksByStatus.completed.map(task => <TaskCard key={task.id} task={task} />)}
        </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Task Calendar
                </CardTitle>
                <CardDescription>
                  Click on a date to view tasks for that day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={new Date()}
                  className="rounded-md"
                  modifiers={{
                    hasTasks: getDaysWithTasks()
                  }}
                  modifiersStyles={{
                    hasTasks: { 
                      backgroundColor: 'hsl(var(--primary))', 
                      color: 'hsl(var(--primary-foreground))',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Today's Tasks
                </CardTitle>
                <CardDescription>
                  {getDayTasks(new Date()).length} task(s) due today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getDayTasks(new Date()).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No tasks due today</p>
                ) : (
                  getDayTasks(new Date()).map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="mt-1 rounded-full p-1 transition-colors bg-gray-100 text-gray-400 hover:bg-gray-200"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <div className="flex items-center gap-1">
                            <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Subject: {task.subject}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tasks;