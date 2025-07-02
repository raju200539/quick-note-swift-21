
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import NoteCard from '../components/NoteCard';
import AddNoteModal from '../components/AddNoteModal';
import ThemeToggle from '../components/ThemeToggle';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('quicknotes-data');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt)
        }));
        setNotes(parsedNotes);
      } catch (error) {
        console.error('Error loading notes from localStorage:', error);
        // If there's an error, initialize with welcome notes
        initializeWelcomeNotes();
      }
    } else {
      // First time user - show welcome notes
      initializeWelcomeNotes();
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (notes.length > 0 || localStorage.getItem('quicknotes-data')) {
      localStorage.setItem('quicknotes-data', JSON.stringify(notes));
    }
  }, [notes]);

  const initializeWelcomeNotes = () => {
    const welcomeNotes: Note[] = [
      {
        id: '1',
        title: 'Welcome to QuickNotes! 📝',
        content: 'Start capturing your ideas instantly. Your notes will be saved automatically in this browser.',
        createdAt: new Date()
      },
      {
        id: '2', 
        title: 'Getting Started',
        content: 'Click the + button to add more notes! Each note can have a title and content.',
        createdAt: new Date()
      }
    ];
    setNotes(welcomeNotes);
  };

  const addNote = (title: string, content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled Note',
      content,
      createdAt: new Date()
    };
    setNotes(prev => [newNote, ...prev]);
    setIsModalOpen(false);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-150">
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-1 sm:mb-2">
                QuickNotes
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
                Fast and simple note-taking
              </p>
            </div>
            <div className="absolute right-4 sm:right-6 lg:right-8">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Bar */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200">{notes.length}</div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Total Notes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">💾</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Auto-saved</div>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:from-indigo-700 hover:to-blue-700 dark:hover:from-indigo-600 dark:hover:to-blue-600 transition-all duration-150 transform hover:scale-105 shadow-lg text-sm sm:text-base active:scale-95"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Note</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-5xl sm:text-6xl mb-4">📝</div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">No notes yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm sm:text-base">Click the + button to create your first note!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:from-indigo-700 hover:to-blue-700 dark:hover:from-indigo-600 dark:hover:to-blue-600 transition-all duration-150 transform hover:scale-105 shadow-lg text-sm sm:text-base active:scale-95"
            >
              Create First Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onDelete={deleteNote}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button - Mobile */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white p-4 rounded-full shadow-2xl hover:from-indigo-700 hover:to-blue-700 dark:hover:from-indigo-600 dark:hover:to-blue-600 transition-all duration-150 transform hover:scale-110 z-50 active:scale-95"
      >
        <Plus size={24} />
      </button>

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addNote}
      />

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200/50 dark:border-slate-700/50 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Built with ❤️ for productivity
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
