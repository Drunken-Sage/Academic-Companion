import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Download, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    created_at: string;
  };
}

const FilePreview = ({ file }: FilePreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isImage = file.type.startsWith('image/');
  const isText = file.type.startsWith('text/') || 
                 file.type === 'application/json' ||
                 file.name.endsWith('.md') ||
                 file.name.endsWith('.txt') ||
                 file.name.endsWith('.js') ||
                 file.name.endsWith('.ts') ||
                 file.name.endsWith('.jsx') ||
                 file.name.endsWith('.tsx') ||
                 file.name.endsWith('.css') ||
                 file.name.endsWith('.html') ||
                 file.name.endsWith('.xml') ||
                 file.name.endsWith('.csv');
  const isPDF = file.type === 'application/pdf';

  const handlePreview = async () => {
    setIsOpen(true);
    
    if (isText && !fileContent) {
      setLoading(true);
      try {
        // For Supabase storage, we need to fetch with proper headers
        const response = await fetch(file.url, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain, text/*, application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        const text = await response.text();
        setFileContent(text);
      } catch (error) {
        console.error('Error loading file content:', error);
        setFileContent('Error loading file content. The file might be too large or in a format that cannot be displayed as text.');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="flex justify-center">
          <img 
            src={file.url} 
            alt={file.name}
            className="max-w-full max-h-96 object-contain rounded-lg"
          />
        </div>
      );
    }

    if (isText) {
      if (loading) {
        return <div className="text-center py-8">Loading file content...</div>;
      }
      
      return (
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap break-words">
            {fileContent}
          </pre>
        </ScrollArea>
      );
    }

    if (isPDF) {
      return (
        <div className="text-center py-8">
          <iframe
            src={file.url}
            className="w-full h-96 border rounded-lg"
            title={file.name}
          />
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Preview not available for this file type
        </p>
        <Button asChild>
          <a href={file.url} download={file.name}>
            <Download className="h-4 w-4 mr-2" />
            Download to view
          </a>
        </Button>
      </div>
    );
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handlePreview}
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{file.name}</span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <a href={file.url} download={file.name}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FilePreview;