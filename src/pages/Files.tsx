import { useState, useRef, useEffect } from "react";
import { Upload, Search, FileText, Download, Trash2, FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
}

const Files = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: filesData, error } = await supabase.storage
        .from('user-files')
        .list(user.id, {
          limit: 100,
          offset: 0,
        });

      if (error) throw error;

      const filesWithUrls = await Promise.all(
        filesData.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('user-files')
            .getPublicUrl(`${user.id}/${file.name}`);

          return {
            id: file.id || file.name,
            name: file.name,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype || 'unknown',
            url: publicUrl,
            created_at: file.created_at || new Date().toISOString(),
          };
        })
      );

      setFiles(filesWithUrls);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      const { data, error } = await supabase.storage
        .from('user-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      // Refresh the files list
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      // Remove progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }, 2000);
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.storage
        .from('user-files')
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      setFiles(prev => prev.filter(file => file.name !== fileName));
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
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

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Files</h1>
        </div>
        <p className="text-muted-foreground">Loading your files...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-muted-foreground">Upload and manage your files</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Plus className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Zone */}
      <Card 
        className="mb-6 border-dashed border-2 hover:border-primary transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop files here, or click to select files
          </p>
          <Button variant="outline">Choose Files</Button>
        </CardContent>
      </Card>

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

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{files.length}</div>
            <p className="text-sm text-muted-foreground">Total Files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
            </div>
            <p className="text-sm text-muted-foreground">Total Size</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {new Set(files.map(file => file.type)).size}
            </div>
            <p className="text-sm text-muted-foreground">File Types</p>
          </CardContent>
        </Card>
      </div>

      {/* Files List */}
      <div className="space-y-4">
        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No files yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first file to get started
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredFiles.map(file => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{file.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.type}</span>
                        <span>•</span>
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <a href={file.url} download={file.name}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteFile(file.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Files;