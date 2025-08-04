import { useState } from "react";
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
import { CalendarIcon, CheckCircle2, Clock, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  title: string;
  description?: string;
  date: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const TodoCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: '1',
      title: 'Submit Research Paper',
      description: 'Final submission for Advanced Computer Science research project',
      date: new Date(2024, 11, 25),
      completed: false,
      priority: 'high'
    },
    {
      id: '2',
      title: 'Study Group Meeting',
      description: 'Weekly study session for Mathematics exam preparation',
      date: new Date(2024, 11, 23),
      completed: true,
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Library Research',
      description: 'Research materials for thesis chapter 3',
      date: new Date(),
      completed: false,
      priority: 'medium'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTodo, setNewTodo] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>({
    title: '',
    description: '',
    priority: 'medium'
  });

  const getDayTodos = (date: Date) => {
    return todos.filter(todo => isSameDay(todo.date, date));
  };

  const getSelectedDayTodos = () => {
    if (!selectedDate) return [];
    return getDayTodos(selectedDate);
  };

  const addTodo = () => {
    if (!newTodo.title.trim() || !selectedDate) return;
    
    const todo: Todo = {
      id: Date.now().toString(),
      title: newTodo.title,
      description: newTodo.description,
      date: selectedDate,
      completed: false,
      priority: newTodo.priority
    };

    setTodos([...todos, todo]);
    setNewTodo({ title: '', description: '', priority: 'medium' });
    setIsDialogOpen(false);
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const getPriorityColor = (priority: Todo['priority']): "destructive" | "todo" | "organizer" | "secondary" => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'todo';
      case 'low': return 'organizer';
      default: return 'secondary';
    }
  };

  const getDaysWithTodos = () => {
    return todos.map(todo => startOfDay(todo.date));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Calendar-Integrated Todo Lists</h2>
        <p className="text-muted-foreground">
          Organize your academic tasks with calendar view and smart scheduling
        </p>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Academic Calendar
                </CardTitle>
                <CardDescription>
                  Click a date to view and manage your todos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border pointer-events-auto"
                  modifiers={{
                    hasEvents: getDaysWithTodos()
                  }}
                  modifiersClassNames={{
                    hasEvents: "bg-todo/20 font-semibold"
                  }}
                />
              </CardContent>
            </Card>

            {/* Daily Todo List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>
                    {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                  </CardTitle>
                  <CardDescription>
                    {getSelectedDayTodos().length} task(s) scheduled
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!selectedDate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                      <DialogDescription>
                        Create a new task for {selectedDate && format(selectedDate, "MMMM d, yyyy")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                          id="title"
                          value={newTodo.title}
                          onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                          placeholder="Enter task title..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          value={newTodo.description}
                          onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                          placeholder="Add task details..."
                        />
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <div className="flex gap-2 mt-2">
                          {(['low', 'medium', 'high'] as const).map((priority) => (
                            <Button
                              key={priority}
                              variant={newTodo.priority === priority ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNewTodo({...newTodo, priority: priority})}
                            >
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addTodo} disabled={!newTodo.title.trim()}>
                        Add Task
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getSelectedDayTodos().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks scheduled for this day</p>
                      <p className="text-sm">Click "Add Task" to get started</p>
                    </div>
                  ) : (
                    getSelectedDayTodos().map((todo) => (
                      <div
                        key={todo.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-all",
                          todo.completed ? "bg-muted/50 opacity-60" : "bg-background"
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 mt-0.5"
                          onClick={() => toggleTodo(todo.id)}
                        >
                          <CheckCircle2 
                            className={cn(
                              "h-4 w-4",
                              todo.completed ? "text-organizer" : "text-muted-foreground"
                            )} 
                          />
                        </Button>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              "font-medium text-sm",
                              todo.completed && "line-through text-muted-foreground"
                            )}>
                              {todo.title}
                            </h4>
                            <Badge variant={getPriorityColor(todo.priority)} className="text-xs">
                              {todo.priority}
                            </Badge>
                          </div>
                          {todo.description && (
                            <p className={cn(
                              "text-xs text-muted-foreground",
                              todo.completed && "line-through"
                            )}>
                              {todo.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTodo(todo.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>
                Complete overview of all your scheduled tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks created yet</p>
                    <p className="text-sm">Switch to calendar view to add your first task</p>
                  </div>
                ) : (
                  todos
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((todo) => (
                      <div
                        key={todo.id}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg border transition-all",
                          todo.completed ? "bg-muted/50 opacity-60" : "bg-background"
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 mt-0.5"
                          onClick={() => toggleTodo(todo.id)}
                        >
                          <CheckCircle2 
                            className={cn(
                              "h-4 w-4",
                              todo.completed ? "text-organizer" : "text-muted-foreground"
                            )} 
                          />
                        </Button>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              "font-medium",
                              todo.completed && "line-through text-muted-foreground"
                            )}>
                              {todo.title}
                            </h4>
                            <Badge variant={getPriorityColor(todo.priority)}>
                              {todo.priority}
                            </Badge>
                          </div>
                          {todo.description && (
                            <p className={cn(
                              "text-sm text-muted-foreground",
                              todo.completed && "line-through"
                            )}>
                              {todo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            {format(todo.date, "MMM d, yyyy")}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTodo(todo.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
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