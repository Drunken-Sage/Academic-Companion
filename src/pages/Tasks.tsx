import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Complete Physics Assignment',
    description: 'Solve problems 1-15 from Chapter 8',
    subject: 'Physics',
    status: 'pending',
    priority: 'high',
    dueDate: '2024-02-15',
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    title: 'Math Quiz Preparation',
    description: 'Review calculus formulas and practice derivatives',
    subject: 'Mathematics',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2024-02-10',
    createdAt: '2024-01-18'
  },
  {
    id: '3',
    title: 'History Essay Draft',
    description: 'Write first draft of WWI impact essay',
    subject: 'History',
    status: 'completed',
    priority: 'low',
    dueDate: '2024-02-05',
    createdAt: '2024-01-15'
  }
];

const subjects = ['All', 'Physics', 'Mathematics', 'History', 'Chemistry', 'English'];
const priorities = ['All', 'low', 'medium', 'high'];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
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

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const statusOrder: Task['status'][] = ['pending', 'in-progress', 'completed'];
        const currentIndex = statusOrder.indexOf(task.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const addTask = () => {
    if (!newTask.title || !newTask.subject || !newTask.dueDate) return;
    
    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setTasks(prev => [...prev, task]);
    setNewTask({ title: '', description: '', subject: '', priority: 'medium', dueDate: '' });
    setIsDialogOpen(false);
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
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
    </div>
  );
};

export default Tasks;