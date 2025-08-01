import { useState, useRef, useEffect } from "react";
import { Search, FolderOpen, FileText, Download, Trash2, Edit, Eye, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  word_count: number;
  created_at: string;
  updated_at: string;
}

const Files = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewNote, setSelectedPreviewNote] = useState<Note | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: notesData } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (notesData) {
          setNotes(notesData);
          
          // Extract unique subjects
          const uniqueSubjects = ['All', ...new Set(notesData.map(note => note.subject))];
          setSubjects(uniqueSubjects);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast({
          title: "Error",
          description: "Failed to load notes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [toast]);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  const notesBySubject = subjects.slice(1).reduce((acc, subject) => {
    acc[subject] = filteredNotes.filter(note => note.subject === subject);
    return acc;
  }, {} as Record<string, Note[]>);

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const previewNoteHandler = (note: Note) => {
    setSelectedPreviewNote(note);
    setIsPreviewOpen(true);
  };

  const getFileSizeEstimate = (content: string) => {
    // Rough estimate: 1 character ≈ 1 byte
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const NoteCard = ({ note }: { note: Note }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{note.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  Note
                </Badge>
                <span className="text-xs text-muted-foreground">{getFileSizeEstimate(note.content)}</span>
                <span className="text-xs text-muted-foreground">
                  {note.word_count} words
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {note.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {note.content.substring(0, 100)}
                {note.content.length > 100 && '...'}
              </p>
              <p className="text-xs text-muted-foreground">
                Subject: {note.subject} • Created: {format(new Date(note.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => previewNoteHandler(note)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteNote(note.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SubjectFolder = ({ subject, notes }: { subject: string; notes: Note[] }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          {subject} ({notes.length} notes)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No notes in this subject</p>
        ) : (
          <div className="space-y-2">
            {notes.map(note => <NoteCard key={note.id} note={note} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Notes & Documents</h1>
        </div>
        <p className="text-muted-foreground">Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notes & Documents</h1>
          <p className="text-muted-foreground">Your notes organized by subject</p>
        </div>
        <Button onClick={() => window.location.href = '/notes'}>
          <Plus className="h-4 w-4 mr-2" />
          Create Note
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes, content, or tags..."
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
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{notes.length}</div>
            <p className="text-sm text-muted-foreground">Total Notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{subjects.length - 1}</div>
            <p className="text-sm text-muted-foreground">Subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {notes.reduce((sum, note) => sum + note.word_count, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total Words</p>
          </CardContent>
        </Card>
      </div>

      {/* Notes by Subject */}
      <div className="space-y-6">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first note
              </p>
              <Button onClick={() => window.location.href = '/notes'}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(notesBySubject).map(([subject, subjectNotes]) => (
            <SubjectFolder key={subject} subject={subject} notes={subjectNotes} />
          ))
        )}
      </div>

      {/* Note Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedPreviewNote?.title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {selectedPreviewNote && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Subject: {selectedPreviewNote.subject}</span>
                  <span>•</span>
                  <span>{selectedPreviewNote.word_count} words</span>
                  <span>•</span>
                  <span>Created: {format(new Date(selectedPreviewNote.created_at), 'MMM dd, yyyy')}</span>
                </div>
                {selectedPreviewNote.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    {selectedPreviewNote.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <Textarea
                  value={selectedPreviewNote.content}
                  readOnly
                  className="min-h-64 resize-none"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Files;