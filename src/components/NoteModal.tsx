
import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
  editingNote?: Note | null;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSave, editingNote }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const isEditing = !!editingNote;

  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        setTitle(editingNote.title);
        setContent(editingNote.content);
      } else {
        setTitle('');
        setContent('');
      }
    }
  }, [isOpen, editingNote]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() || content.trim()) {
      onSave(title, content.trim());
      setTitle('');
      setContent('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-150 scale-100 animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Plus size={20} className="text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{isEditing ? 'Edit Note' : 'Add New Note'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors duration-150 active:scale-90"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Title Field */}
          <div className="mb-4">
            <label htmlFor="note-title" className="block text-sm font-medium text-foreground mb-2">
              Title
            </label>
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="w-full p-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground bg-background transition-all duration-150"
              autoFocus
            />
          </div>

          {/* Content Field */}
          <div className="mb-6">
            <label htmlFor="note-content" className="block text-sm font-medium text-foreground mb-2">
              Content
            </label>
            <textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="What's on your mind?"
              className="w-full h-32 p-4 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-foreground placeholder-muted-foreground bg-background transition-all duration-150"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                Press Cmd/Ctrl + Enter to save quickly
              </p>
              <span className="text-xs text-muted-foreground">
                {content.length} characters
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-input text-foreground rounded-xl hover:bg-accent transition-colors duration-150 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() && !content.trim()}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 transform hover:scale-105 active:scale-95"
            >
              {isEditing ? 'Save Changes' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;
