import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Download, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilePreviewProps {
  file: {
    id: string;
    original_name: string;
    display_name: string;
    file_size: number;
    mime_type: string;
    storage_path: string;
    url: string;
    created_at: string;
  };
}

const FilePreview = ({ file }: FilePreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isImage = file.mime_type.startsWith('image/');
  const isText = file.mime_type.startsWith('text/') ||
                 file.mime_type === 'application/json' ||
                 file.display_name.endsWith('.md') ||
                 file.display_name.endsWith('.txt') ||
                 file.display_name.endsWith('.js') ||
                 file.display_name.endsWith('.ts') ||
                 file.display_name.endsWith('.jsx') ||
                 file.display_name.endsWith('.tsx') ||
                 file.display_name.endsWith('.css') ||
                 file.display_name.endsWith('.html') ||
                 file.display_name.endsWith('.xml') ||
                 file.display_name.endsWith('.csv');
  const isPDF = file.mime_type === 'application/pdf';

  const downloadFile = async () => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

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
            alt={file.display_name}
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
            title={file.display_name}
          />
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Preview not available for this file type
        </p>
        <Button onClick={downloadFile}>
          <Download className="h-4 w-4 mr-2" />
          Download to view
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
              <span>{file.display_name}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadFile}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
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