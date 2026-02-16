import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Send, FileText, Paperclip, X, File } from 'lucide-react';

const PROJECT_TYPES = [
  { id: 'research', label: 'Research' },
  { id: 'threat-intelligence', label: 'Threat Intelligence' },
  { id: 'prototype', label: 'Prototype / Tool' },
  { id: 'advisory', label: 'Advisory' },
  { id: 'training', label: 'Training' },
  { id: 'other', label: 'Other' },
];

const DURATION_OPTIONS = [
  '1-2 weeks',
  '1 month',
  '2-3 months',
  '3-6 months',
  '6+ months',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv'
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function RequestForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; id: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    projectTypes: [] as string[],
    strategicAlignment: '',
    problemStatement: '',
    expectedOutcomes: '',
    estimatedDuration: '',
    keyDependencies: '',
    confidentialityLevel: 'internal' as 'public' | 'internal' | 'restricted',
  });

  const handleTypeChange = (typeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      projectTypes: checked
        ? [...prev.projectTypes, typeId]
        : prev.projectTypes.filter(t => t !== typeId),
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: { file: File; id: string }[] = [];
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async (requestId: string) => {
    if (!user || pendingFiles.length === 0) return;

    for (const { file } of pendingFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${requestId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('request-attachments')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

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
        await supabase.storage.from('request-attachments').remove([filePath]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to submit a request');
      return;
    }

    if (formData.projectTypes.length === 0) {
      toast.error('Please select at least one project type');
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.from('project_requests').insert({
      user_id: user.id,
      title: formData.title,
      project_types: formData.projectTypes,
      strategic_alignment: formData.strategicAlignment || null,
      problem_statement: formData.problemStatement,
      expected_outcomes: formData.expectedOutcomes,
      estimated_duration: formData.estimatedDuration || null,
      key_dependencies: formData.keyDependencies || null,
      confidentiality_level: formData.confidentialityLevel,
    }).select('id').single();

    if (error) {
      toast.error('Failed to submit request: ' + error.message);
      setIsSubmitting(false);
      return;
    }

    // Upload attachments after request is created
    if (pendingFiles.length > 0) {
      await uploadFiles(data.id);
    }

    toast.success('Project request submitted successfully!');
    setFormData({
      title: '',
      projectTypes: [],
      strategicAlignment: '',
      problemStatement: '',
      expectedOutcomes: '',
      estimatedDuration: '',
      keyDependencies: '',
      confidentialityLevel: 'internal',
    });
    setPendingFiles([]);
    setIsSubmitting(false);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <FileText className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle>New Project Request</CardTitle>
            <CardDescription>
              Fill out the form below to submit a new project proposal
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title for your project"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Project Types */}
          <div className="space-y-3">
            <Label>Project Type * (Select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PROJECT_TYPES.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={type.id}
                    checked={formData.projectTypes.includes(type.id)}
                    onCheckedChange={(checked) => handleTypeChange(type.id, checked as boolean)}
                  />
                  <Label htmlFor={type.id} className="cursor-pointer font-normal">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Alignment */}
          <div className="space-y-2">
            <Label htmlFor="strategic-alignment">Strategic Alignment</Label>
            <Input
              id="strategic-alignment"
              placeholder="How does this project align with organizational goals?"
              value={formData.strategicAlignment}
              onChange={(e) => setFormData({ ...formData, strategicAlignment: e.target.value })}
            />
          </div>

          {/* Problem Statement */}
          <div className="space-y-2">
            <Label htmlFor="problem-statement">Problem Statement *</Label>
            <Textarea
              id="problem-statement"
              placeholder="Describe the problem this project aims to solve..."
              value={formData.problemStatement}
              onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
              rows={4}
              required
            />
          </div>

          {/* Expected Outcomes */}
          <div className="space-y-2">
            <Label htmlFor="expected-outcomes">Expected Outcomes *</Label>
            <Textarea
              id="expected-outcomes"
              placeholder="What are the expected deliverables and outcomes?"
              value={formData.expectedOutcomes}
              onChange={(e) => setFormData({ ...formData, expectedOutcomes: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estimated Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration</Label>
              <Select
                value={formData.estimatedDuration}
                onValueChange={(value) => setFormData({ ...formData, estimatedDuration: value })}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Confidentiality Level */}
            <div className="space-y-2">
              <Label htmlFor="confidentiality">Confidentiality Level *</Label>
              <Select
                value={formData.confidentialityLevel}
                onValueChange={(value) => 
                  setFormData({ 
                    ...formData, 
                    confidentialityLevel: value as 'public' | 'internal' | 'restricted' 
                  })
                }
              >
                <SelectTrigger id="confidentiality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="restricted">Restricted / NDA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key Dependencies */}
          <div className="space-y-2">
            <Label htmlFor="dependencies">Key Dependencies</Label>
            <Textarea
              id="dependencies"
              placeholder="List any dependencies, resources, or support needed..."
              value={formData.keyDependencies}
              onChange={(e) => setFormData({ ...formData, keyDependencies: e.target.value })}
              rows={3}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <Label>Attachments</Label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept={ALLOWED_TYPES.join(',')}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Paperclip className="h-4 w-4" />
                Add Files
              </Button>
              <span className="text-xs text-muted-foreground">
                Max 10MB per file. Images, PDFs, Office docs, text files.
              </span>
            </div>

            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                {pendingFiles.map(({ file, id }) => (
                  <div
                    key={id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                  >
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePendingFile(id)}
                      disabled={isSubmitting}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
