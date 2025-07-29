import { useState, useRef } from "react";
import { Upload, Search, FolderOpen, File, Download, Trash2, Edit, Eye, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FileItem {
  id: string;
  name: string;
  subject: string;
  type: 'past-paper' | 'note' | 'slide' | 'assignment' | 'other';
  size: string;
  uploadDate: string;
  tags: string[];
}

const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'Physics_Mechanics_Notes.pdf',
    subject: 'Physics',
    type: 'note',
    size: '2.3 MB',
    uploadDate: '2024-01-20',
    tags: ['mechanics', 'formulas']
  },
  {
    id: '2',
    name: 'Math_Calculus_PastPaper_2023.pdf',
    subject: 'Mathematics',
    type: 'past-paper',
    size: '1.8 MB',
    uploadDate: '2024-01-18',
    tags: ['calculus', '2023', 'final-exam']
  },
  {
    id: '3',
    name: 'History_WWI_Presentation.pptx',
    subject: 'History',
    type: 'slide',
    size: '5.4 MB',
    uploadDate: '2024-01-15',
    tags: ['WWI', 'presentation']
  }
];

const subjects = ['All', 'Physics', 'Mathematics', 'History', 'Chemistry', 'English'];
const fileTypes = ['All', 'past-paper', 'note', 'slide', 'assignment', 'other'];

const Files = () => {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'All' || file.subject === selectedSubject;
    const matchesType = selectedType === 'All' || file.type === selectedType;
    
    return matchesSearch && matchesSubject && matchesType;
  });

  const filesBySubject = subjects.slice(1).reduce((acc, subject) => {
    acc[subject] = filteredFiles.filter(file => file.subject === subject);
    return acc;
  }, {} as Record<string, FileItem[]>);

  const getFileIcon = (type: FileItem['type']) => {
    return <File className="h-8 w-8 text-primary" />;
  };

  const getTypeColor = (type: FileItem['type']) => {
    switch (type) {
      case 'past-paper': return 'destructive';
      case 'note': return 'secondary';
      case 'slide': return 'default';
      case 'assignment': return 'outline';
      default: return 'outline';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => {
      const newFile: FileItem = {
        id: Date.now().toString() + Math.random().toString(),
        name: file.name,
        subject: 'Physics', // Default subject
        type: 'other',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        tags: []
      };
      setFiles(prev => [...prev, newFile]);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    uploadedFiles.forEach(file => {
      const newFile: FileItem = {
        id: Date.now().toString() + Math.random().toString(),
        name: file.name,
        subject: 'Physics', // Default subject
        type: 'other',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        tags: []
      };
      setFiles(prev => [...prev, newFile]);
    });
  };

  const deleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const previewFileHandler = (file: FileItem) => {
    setSelectedPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const FileCard = ({ file }: { file: FileItem }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getFileIcon(file.type)}
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{file.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getTypeColor(file.type)} className="text-xs">
                  {file.type.replace('-', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">{file.size}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {file.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Subject: {file.subject} • Uploaded: {file.uploadDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => previewFileHandler(file)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteFile(file.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SubjectFolder = ({ subject, files }: { subject: string; files: FileItem[] }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          {subject} ({files.length} files)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-muted-foreground text-sm">No files in this subject</p>
        ) : (
          <div className="space-y-2">
            {files.map(file => <FileCard key={file.id} file={file} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Files</h1>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">Drag & drop files here</p>
        <p className="text-muted-foreground">or click the upload button above</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files or tags..."
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
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fileTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'All' ? 'All Types' : type.replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Files by Subject */}
      <div className="space-y-6">
        {Object.entries(filesBySubject).map(([subject, subjectFiles]) => (
          <SubjectFolder key={subject} subject={subject} files={subjectFiles} />
        ))}
      </div>

      {/* File Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedPreviewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
            <div className="text-center">
              <File className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">File preview not available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Download to view the file content
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Files;