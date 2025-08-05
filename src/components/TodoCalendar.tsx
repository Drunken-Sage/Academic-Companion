import { useState, useEffect } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, CheckCircle2, Clock, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Todo {
  id: string;
  title: string;
  description?: string;
  due_date: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

const TodoCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTodo, setNewTodo] = useState<{
    title: string;
    description: string;
    date: Date;
    priority: 'low' | 'medium' | 'high';
  }>({
    title: '',
    description: '',
    date: new Date(),
    priority: 'medium'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const formattedTodos: Todo[] = data.map(todo => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        due_date: new Date(todo.due_date),
        completed: todo.completed,
        priority: todo.priority as 'low' | 'medium' | 'high',
        created_at: todo.created_at,
        updated_at: todo.updated_at
      }));

      setTodos(formattedTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast({
        title: "Error",
        description: "Failed to load todos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayTodos = (date: Date): Todo[] => {
    return todos.filter(todo => isSameDay(todo.due_date, date));
  };

  const getSelectedDayTodos = (): Todo[] => {
    if (!selectedDate) return [];
    return getDayTodos(selectedDate);
  };

  const addTodo = async () => {
    if (!newTodo.title.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('todos')
        .insert([{
          user_id: user.id,
          title: newTodo.title,
          description: newTodo.description,
          due_date: format(newTodo.date, 'yyyy-MM-dd'),
          priority: newTodo.priority,
          completed: false
        }])
        .select()
        .single();

      if (error) throw error;

      const formattedTodo: Todo = {
        id: data.id,
        title: data.title,
        description: data.description,
        due_date: new Date(data.due_date),
        completed: data.completed,
        priority: data.priority as 'low' | 'medium' | 'high',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setTodos(prev => [...prev, formattedTodo]);
      setNewTodo({ title: '', description: '', date: new Date(), priority: 'medium' });
      setIsDialogOpen(false);

      toast({
        title: "Success",
        description: "Todo added successfully",
      });
    } catch (error) {
      console.error('Error adding todo:', error);
      toast({
        title: "Error",
        description: "Failed to add todo",
        variant: "destructive",
      });
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', id);

      if (error) throw error;

      setTodos(prev => prev.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ));

      toast({
        title: "Success",
        description: `Todo ${!todo.completed ? 'completed' : 'uncompleted'}`,
      });
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive",
      });
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTodos(prev => prev.filter(t => t.id !== id));

      toast({
        title: "Success",
        description: "Todo deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast({
        title: "Error",
        description: "Failed to delete todo",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: Todo['priority']): "destructive" | "default" | "secondary" => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getDaysWithTodos = (): Date[] => {
    return todos.map(todo => startOfDay(todo.due_date));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
          <p>Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Todo Calendar</h1>
          <p className="text-muted-foreground">Manage your tasks and deadlines</p>
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
              <DialogDescription>
                Create a new task and set its due date and priority.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="date">Due Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={format(newTodo.date, 'yyyy-MM-dd')}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, date: new Date(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTodo.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTodo(prev => ({ ...prev, priority: value }))}>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addTodo}>Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Calendar
                </CardTitle>
                <CardDescription>
                  Click on a date to view tasks for that day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md"
                  modifiers={{
                    hasTodos: getDaysWithTodos()
                  }}
                  modifiersStyles={{
                    hasTodos: {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Selected Day Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select a date'}
                </CardTitle>
                <CardDescription>
                  {getSelectedDayTodos().length} task(s) for this day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getSelectedDayTodos().length === 0 ? (
                  <p className="text-muted-foreground text-sm">No tasks for this day</p>
                ) : (
                  getSelectedDayTodos().map(todo => (
                    <div key={todo.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={cn(
                          "mt-1 rounded-full p-1 transition-colors",
                          todo.completed
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            "font-medium text-sm",
                            todo.completed && "line-through text-muted-foreground"
                          )}>
                            {todo.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            <Badge variant={getPriorityColor(todo.priority)} className="text-xs">
                              {todo.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTodo(todo.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {todo.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {todo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>
                View and manage all your tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No tasks yet. Create your first task!
                  </p>
                ) : (
                  todos.map(todo => (
                    <div key={todo.id} className="flex items-start gap-3 p-4 rounded-lg border">
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={cn(
                          "mt-1 rounded-full p-1 transition-colors",
                          todo.completed
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            "font-medium",
                            todo.completed && "line-through text-muted-foreground"
                          )}>
                            {todo.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityColor(todo.priority)}>
                              {todo.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTodo(todo.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {todo.description && (
                          <p className="text-muted-foreground mt-1">
                            {todo.description}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Due: {format(todo.due_date, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TodoCalendar;