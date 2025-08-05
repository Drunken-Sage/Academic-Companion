import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';
import { Plus, Search, BookOpen, Edit, Trash2, Save, Tag, Clock, Upload, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import FilePreview from "@/components/FilePreview";

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

interface UploadedFile {
  id: string;
  original_name: string;
  display_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  url: string;
  created_at: string;
  course?: string;
  tags: string[];
}

// Subjects will be loaded from user courses

const Notes = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [subjects, setSubjects] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFileEditorOpen, setIsFileEditorOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [editingNote, setEditingNote] = useState({
    title: '',
    content: '',
    subject: '',
    tags: [] as string[],
    newTag: ''
  });
  const [editingFile, setEditingFile] = useState({
    display_name: '',
    course: '',
    tags: [] as string[],
    newTag: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication and fetch notes
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      await fetchNotes(session.user.id);
      await fetchFiles(session.user.id);
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
          await fetchNotes(session.user.id);
          await fetchFiles(session.user.id);
          await fetchUserCourses(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchNotes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        toast({
          title: "Error fetching notes",
          description: error.message,
          variant: "destructive"
        });
      } else {
        const formattedNotes: Note[] = data.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          subject: note.subject,
          tags: note.tags || [],
          wordCount: note.word_count || 0,
          createdAt: new Date(note.created_at).toISOString().split('T')[0],
          updatedAt: new Date(note.updated_at).toISOString().split('T')[0]
        }));
        setNotes(formattedNotes);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchFiles = async (userId: string) => {
    try {
      // Fetch file metadata from database
      const { data: filesData, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get public URLs for each file
      const filesWithUrls = filesData.map((file) => {
        const { data: { publicUrl } } = supabase.storage
          .from('user-files')
          .getPublicUrl(file.storage_path);

        return {
          ...file,
          url: publicUrl,
          tags: file.tags || [],
        };
      });

      setFiles(filesWithUrls);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error fetching files",
        description: "Failed to load documents",
        variant: "destructive",
      });
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
          setSubjects(['All', 'General', 'Study Notes', 'Research']);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setSubjects(['All', 'General', 'Study Notes', 'Research']);
    }
  };

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
        subject: subjects.length > 1 ? subjects[1] : 'General',
        tags: [],
        newTag: ''
      });
      setIsEditing(false);
    }
    setIsEditorOpen(true);
  };

  const saveNote = async () => {
    if (!editingNote.title || !editingNote.content || !user) return;

    try {
      if (isEditing && selectedNote) {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update({
            title: editingNote.title,
            content: editingNote.content,
            subject: editingNote.subject,
            tags: editingNote.tags
          })
          .eq('id', selectedNote.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          toast({
            title: "Error updating note",
            description: error.message,
            variant: "destructive"
          });
        } else {
          const updatedNote: Note = {
            id: data.id,
            title: data.title,
            content: data.content,
            subject: data.subject,
            tags: data.tags || [],
            wordCount: data.word_count || 0,
            createdAt: new Date(data.created_at).toISOString().split('T')[0],
            updatedAt: new Date(data.updated_at).toISOString().split('T')[0]
          };

          setNotes(prev => prev.map(note =>
            note.id === selectedNote.id ? updatedNote : note
          ));
          setSelectedNote(updatedNote);
          toast({
            title: "Note updated",
            description: "Your note has been successfully updated.",
          });
        }
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert([
            {
              user_id: user.id,
              title: editingNote.title,
              content: editingNote.content,
              subject: editingNote.subject,
              tags: editingNote.tags
            }
          ])
          .select()
          .single();

        if (error) {
          toast({
            title: "Error creating note",
            description: error.message,
            variant: "destructive"
          });
        } else {
          const newNote: Note = {
            id: data.id,
            title: data.title,
            content: data.content,
            subject: data.subject,
            tags: data.tags || [],
            wordCount: data.word_count || 0,
            createdAt: new Date(data.created_at).toISOString().split('T')[0],
            updatedAt: new Date(data.updated_at).toISOString().split('T')[0]
          };

          setNotes(prev => [newNote, ...prev]);
          toast({
            title: "Note created",
            description: "Your new note has been added successfully.",
          });
        }
      }

      setIsEditorOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error deleting note",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
        toast({
          title: "Note deleted",
          description: "Note has been successfully deleted.",
        });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
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

  const openFileEditor = (file: UploadedFile) => {
    setEditingFile({
      display_name: file.display_name,
      course: file.course || '',
      tags: [...file.tags],
      newTag: ''
    });
    setSelectedFile(file);
    setIsFileEditorOpen(true);
  };

  const saveFile = async () => {
    if (!editingFile.display_name || !selectedFile || !user) return;

    try {
      const { data, error } = await supabase
        .from('user_files')
        .update({
          display_name: editingFile.display_name,
          course: editingFile.course || null,
          tags: editingFile.tags
        })
        .eq('id', selectedFile.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error updating document",
          description: error.message,
          variant: "destructive"
        });
      } else {
        const updatedFile = {
          ...selectedFile,
          display_name: data.display_name,
          course: data.course,
          tags: data.tags || []
        };

        setFiles(prev => prev.map(file =>
          file.id === selectedFile.id ? updatedFile : file
        ));
        setSelectedFile(updatedFile);
        toast({
          title: "Document updated",
          description: "Document has been successfully updated.",
        });
        setIsFileEditorOpen(false);
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const addFileTag = () => {
    if (editingFile.newTag && !editingFile.tags.includes(editingFile.newTag)) {
      setEditingFile(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag],
        newTag: ''
      }));
    }
  };

  const removeFileTag = (tagToRemove: string) => {
    setEditingFile(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const uploadFile = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique storage path
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storagePath = `${user.id}/${uniqueFileName}`;

      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      // Upload to storage
      const { data, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('user_files')
        .insert({
          user_id: user.id,
          storage_path: storagePath,
          original_name: file.name,
          display_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream'
        });

      if (dbError) throw dbError;

      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Refresh files list
      fetchFiles(user.id);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }, 2000);
    }
  };

  const deleteFile = async (fileId: string, storagePath: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(file => file.id !== fileId));
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    selectedFiles.forEach(uploadFile);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    droppedFiles.forEach(uploadFile);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCourse = selectedSubject === 'All' || file.course === selectedSubject;
    return matchesSearch && matchesCourse;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
          <p>Loading your notes...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notes & Documents</h1>
        <div className="flex gap-2">
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <Card key={fileName} className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{fileName}</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      ))}

      <Tabs defaultValue="notes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({files.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
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
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documents List */}
            <div className="lg:col-span-1">
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
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

              {/* Drop Zone */}
              <Card 
                className="mb-4 border-dashed border-2 hover:border-primary transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drop files here or click to upload
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredFiles.map(file => (
                  <Card
                    key={file.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedFile?.id === file.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm line-clamp-1">{file.display_name}</h3>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFileEditor(file);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a href={file.url} download={file.display_name}>
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFile(file.id, file.storage_path);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{file.mime_type}</span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                      </div>
                      {file.course && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">{file.course}</Badge>
                        </div>
                      )}
                      {file.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {file.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{file.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Document Viewer */}
            <div className="lg:col-span-2">
              {selectedFile ? (
                <Card className="h-[600px]">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedFile.display_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{selectedFile.mime_type}</Badge>
                          {selectedFile.course && <Badge variant="outline">{selectedFile.course}</Badge>}
                          <span className="text-sm text-muted-foreground">
                            {formatFileSize(selectedFile.file_size)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Uploaded: {new Date(selectedFile.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => openFileEditor(selectedFile)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <FilePreview file={selectedFile} />
                        <Button variant="outline" asChild>
                          <a href={selectedFile.url} download={selectedFile.display_name}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                    {selectedFile.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {selectedFile.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4" />
                      <p>Click "Preview" to view the document content</p>
                      <p className="text-sm mt-2">Use the preview button or download to access the file</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Select a document to view</h3>
                    <p className="text-muted-foreground">Choose a document from the list to preview its details</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

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

      {/* File Editor Dialog */}
      <Dialog open={isFileEditorOpen} onOpenChange={setIsFileEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={editingFile.display_name}
                onChange={(e) => setEditingFile(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Enter document name..."
              />
            </div>

            <div>
              <Label htmlFor="course">Course</Label>
              <Select
                value={editingFile.course}
                onValueChange={(value) => setEditingFile(prev => ({ ...prev, course: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No course</SelectItem>
                  {subjects.slice(1).map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={editingFile.newTag}
                  onChange={(e) => setEditingFile(prev => ({ ...prev, newTag: e.target.value }))}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && addFileTag()}
                />
                <Button onClick={addFileTag} variant="outline">Add Tag</Button>
              </div>
              <div className="flex gap-1 flex-wrap">
                {editingFile.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0"
                      onClick={() => removeFileTag(tag)}
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsFileEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveFile}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;