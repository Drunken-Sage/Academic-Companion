import { useState } from "react";
import { Plus, Search, BookOpen, Edit, Trash2, Save, Tag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Newton\'s Laws of Motion',
    content: 'First Law: An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.\n\nSecond Law: The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. F = ma\n\nThird Law: For every action, there is an equal and opposite reaction.',
    subject: 'Physics',
    tags: ['mechanics', 'fundamental-laws', 'newton'],
    createdAt: '2024-01-20',
    updatedAt: '2024-01-22',
    wordCount: 89
  },
  {
    id: '2',
    title: 'Calculus - Derivatives',
    content: 'A derivative represents the rate of change of a function with respect to a variable.\n\nBasic Rules:\n- Power Rule: d/dx[x^n] = nx^(n-1)\n- Product Rule: d/dx[uv] = u\'v + uv\'\n- Chain Rule: d/dx[f(g(x))] = f\'(g(x)) × g\'(x)\n\nApplications:\n- Finding slopes of tangent lines\n- Optimization problems\n- Related rates',
    subject: 'Mathematics',
    tags: ['calculus', 'derivatives', 'formulas'],
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18',
    wordCount: 78
  },
  {
    id: '3',
    title: 'World War I Causes',
    content: 'The main causes of World War I can be remembered using the acronym MAIN:\n\nM - Militarism: Arms race between European powers\nA - Alliances: Complex web of military alliances\nI - Imperialism: Competition for colonies\nN - Nationalism: Rising nationalist movements\n\nThe immediate trigger was the assassination of Archduke Franz Ferdinand in Sarajevo on June 28, 1914.',
    subject: 'History',
    tags: ['WWI', 'causes', 'MAIN', 'archduke'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-16',
    wordCount: 95
  }
];

const subjects = ['All', 'Physics', 'Mathematics', 'History', 'Chemistry', 'English'];

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState({
    title: '',
    content: '',
    subject: '',
    tags: [] as string[],
    newTag: ''
  });

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  const openNote = (note: Note) => {
    setSelectedNote(note);
  };

  const openEditor = (note?: Note) => {
    if (note) {
      setEditingNote({
        title: note.title,
        content: note.content,
        subject: note.subject,
        tags: [...note.tags],
        newTag: ''
      });
      setIsEditing(true);
    } else {
      setEditingNote({
        title: '',
        content: '',
        subject: 'Physics',
        tags: [],
        newTag: ''
      });
      setIsEditing(false);
    }
    setIsEditorOpen(true);
  };

  const saveNote = () => {
    if (!editingNote.title || !editingNote.content) return;

    const now = new Date().toISOString().split('T')[0];
    const wordCount = editingNote.content.split(/\s+/).filter(word => word.length > 0).length;

    if (isEditing && selectedNote) {
      setNotes(prev => prev.map(note => 
        note.id === selectedNote.id 
          ? {
              ...note,
              title: editingNote.title,
              content: editingNote.content,
              subject: editingNote.subject,
              tags: editingNote.tags,
              updatedAt: now,
              wordCount
            }
          : note
      ));
      setSelectedNote(prev => prev ? { ...prev, title: editingNote.title, content: editingNote.content } : null);
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: editingNote.title,
        content: editingNote.content,
        subject: editingNote.subject,
        tags: editingNote.tags,
        createdAt: now,
        updatedAt: now,
        wordCount
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setIsEditorOpen(false);
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }
  };

  const addTag = () => {
    if (editingNote.newTag && !editingNote.tags.includes(editingNote.newTag)) {
      setEditingNote(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditingNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notes</h1>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes List */}
        <div className="lg:col-span-1">
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredNotes.map(note => (
              <Card 
                key={note.id} 
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedNote?.id === note.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => openNote(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{note.title}</h3>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditor(note);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{note.subject}</Badge>
                    <span className="text-xs text-muted-foreground">{note.wordCount} words</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{note.updatedAt}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Note Viewer */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <Card className="h-[600px]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedNote.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedNote.subject}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {selectedNote.wordCount} words
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Updated: {selectedNote.updatedAt}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => openEditor(selectedNote)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="flex gap-1 mt-2">
                  {selectedNote.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none">
                  {selectedNote.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-3">
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select a note to view</h3>
                <p className="text-muted-foreground">Choose a note from the list to read its content</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Note Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Note' : 'Create New Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title..."
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={editingNote.subject} 
                  onValueChange={(value) => setEditingNote(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.slice(1).map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editingNote.content}
                onChange={(e) => setEditingNote(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your note content here..."
                className="min-h-[300px] resize-none"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={editingNote.newTag}
                  onChange={(e) => setEditingNote(prev => ({ ...prev, newTag: e.target.value }))}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} variant="outline">Add Tag</Button>
              </div>
              <div className="flex gap-1 flex-wrap">
                {editingNote.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0"
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveNote}>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;