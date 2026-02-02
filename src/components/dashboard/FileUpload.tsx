import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, X, File, Loader2, Paperclip } from 'lucide-react';

interface FileUploadProps {
  requestId: string;
  onUploadComplete: () => void;
  disabled?: boolean;
}

interface PendingFile {
  file: File;
  id: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv'
];

export function FileUpload({ requestId, onUploadComplete, disabled }: FileUploadProps) {
  const { user } = useAuth();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles: PendingFile[] = [];
    
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: File type not allowed`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File size exceeds 10MB limit`);
        continue;
      }
      validFiles.push({ file, id: crypto.randomUUID() });
    }
    
    setPendingFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    if (!user || pendingFiles.length === 0) return;
    
    setUploading(true);
    let successCount = 0;
    
    for (const { file } of pendingFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${requestId}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('request-attachments')
        .upload(filePath, file);
      
      if (uploadError) {
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }
      
      // Create attachment record
      const { error: dbError } = await supabase
        .from('request_attachments')
        .insert({
          request_id: requestId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
        });
      
      if (dbError) {
        toast.error(`Failed to save ${file.name}: ${dbError.message}`);
        // Try to clean up the uploaded file
        await supabase.storage.from('request-attachments').remove([filePath]);
        continue;
      }
      
      successCount++;
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      setPendingFiles([]);
      onUploadComplete();
    }
    
    setUploading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept={ALLOWED_TYPES.join(',')}
          disabled={disabled || uploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="gap-2"
        >
          <Paperclip className="h-4 w-4" />
          Add Files
        </Button>
        <span className="text-xs text-muted-foreground">
          Max 10MB per file. Supports images, PDFs, Office documents, and text files.
        </span>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Pending uploads:</p>
          <div className="space-y-2">
            {pendingFiles.map(({ file, id }) => (
              <div
                key={id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
              >
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePendingFile(id)}
                  disabled={uploading}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            onClick={uploadFiles}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload {pendingFiles.length} file(s)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
