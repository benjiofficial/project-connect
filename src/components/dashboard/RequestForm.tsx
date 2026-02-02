import { useState } from 'react';
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
import { Loader2, Send, FileText } from 'lucide-react';

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

export function RequestForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    const { error } = await supabase.from('project_requests').insert({
      user_id: user.id,
      title: formData.title,
      project_types: formData.projectTypes,
      strategic_alignment: formData.strategicAlignment || null,
      problem_statement: formData.problemStatement,
      expected_outcomes: formData.expectedOutcomes,
      estimated_duration: formData.estimatedDuration || null,
      key_dependencies: formData.keyDependencies || null,
      confidentiality_level: formData.confidentialityLevel,
    });

    if (error) {
      toast.error('Failed to submit request: ' + error.message);
    } else {
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
    }

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
