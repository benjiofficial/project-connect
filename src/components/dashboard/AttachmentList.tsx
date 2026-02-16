import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  File, 
  Image, 
  FileText, 
  Table, 
  Download, 
  Trash2, 
  Loader2,
  ExternalLink 
} from 'lucide-react';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  user_id: string;
}

interface AttachmentListProps {
  requestId: string;
  canDelete?: boolean;
  refreshKey?: number;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType === 'text/csv') return Table;
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('word')) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function AttachmentList({ requestId, canDelete = false, refreshKey = 0 }: AttachmentListProps) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAttachments();
  }, [requestId, refreshKey]);

  const fetchAttachments = async () => {
    const { data, error } = await supabase
      .from('request_attachments')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching attachments:', error);
    } else {
      setAttachments(data || []);
    }
    setLoading(false);
  };

  const handleDownload = async (attachment: Attachment) => {
    const { data, error } = await supabase.storage
      .from('request-attachments')
      .createSignedUrl(attachment.file_path, 60); // 60 seconds expiry

    if (error) {
      toast.error('Failed to generate download link');
      return;
    }

    // Open in new tab or trigger download
    window.open(data.signedUrl, '_blank');
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Delete ${attachment.file_name}?`)) return;
    
    setDeletingId(attachment.id);
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('request-attachments')
      .remove([attachment.file_path]);

    if (storageError) {
      toast.error('Failed to delete file from storage');
      setDeletingId(null);
      return;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('request_attachments')
      .delete()
      .eq('id', attachment.id);

    if (dbError) {
      toast.error('Failed to delete attachment record');
    } else {
      toast.success('Attachment deleted');
      setAttachments(attachments.filter(a => a.id !== attachment.id));
    }
    
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No attachments
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        const FileIcon = getFileIcon(attachment.file_type);
        const isDeleting = deletingId === attachment.id;
        const canDeleteThis = canDelete && user?.id === attachment.user_id;

        return (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border shrink-0">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.file_size)} • {format(new Date(attachment.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(attachment)}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              {canDeleteThis && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(attachment)}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                  title="Delete"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
