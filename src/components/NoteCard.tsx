
import React, { useState } from 'react';
import { Trash2, Edit } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onEdit: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(note.id);
    }, 100);
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
    <div 
      className={`bg-card/90 backdrop-blur-sm rounded-xl p-6 border border-border shadow-sm hover:shadow-lg transition-all duration-150 transform hover:-translate-y-1 group active:scale-95 ${
        isDeleting ? 'scale-95 opacity-0 transition-all duration-150' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-xs text-muted-foreground font-medium">
          {formatDate(note.createdAt)}
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => onEdit(note)}
            className="text-muted-foreground hover:text-primary p-1 rounded-lg hover:bg-accent transition-all duration-150 active:scale-90"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-all duration-150 active:scale-90"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Note Title */}
      <div className="mb-3">
        <h3 className="font-semibold text-card-foreground text-lg leading-tight break-words">
          {note.title}
        </h3>
      </div>
      
      {/* Note Content */}
      <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words text-sm">
        {note.content}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Note #{note.id.slice(-4)}</span>
          <span>{note.content.length} chars</span>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
