
import React, { useState } from 'react';
import { Trash2, Edit, Mail } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface NoteCardProps {
  note: Note;
  noteNumber: number;
  onDelete: (id: string) => void;
  onEdit: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, noteNumber, onDelete, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(note.id);
    }, 100);
  };

  const handleShare = () => {
    const subject = encodeURIComponent(`Shared Note: ${note.title}`);
    const body = encodeURIComponent(`Hi!\n\nI wanted to share this note with you:\n\n${note.title}\n\n${note.content}\n\nShared from QuickNotes`);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoUrl);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card 
      className={`transition-all duration-150 transform hover:-translate-y-1 group active:scale-95 ${
        isDeleting ? 'scale-95 opacity-0 transition-all duration-150' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="text-xs">
            {formatDate(note.createdAt)}
          </Badge>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <Mail size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(note)}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <Edit size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <h3 className="font-semibold text-lg leading-tight break-words mb-3">
          {note.title}
        </h3>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words text-sm">
          {note.content}
        </p>
      </CardContent>
      
      <CardFooter className="pt-3">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            Note #{noteNumber}
          </Badge>
          <span>{note.content.length} chars</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NoteCard;
