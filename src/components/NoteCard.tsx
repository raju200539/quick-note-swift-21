
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
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
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-150 transform hover:-translate-y-1 group active:scale-95 ${
        isDeleting ? 'scale-95 opacity-0 transition-all duration-150' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {formatDate(note.createdAt)}
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      {/* Note Title */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight break-words">
          {note.title}
        </h3>
      </div>
      
      {/* Note Content */}
      <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words text-sm">
        {note.content}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Note #{note.id.slice(-4)}</span>
          <span>{note.content.length} chars</span>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
