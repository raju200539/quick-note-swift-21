-- Add file_id column to notes table to link notes to files
ALTER TABLE public.notes 
ADD COLUMN file_id UUID REFERENCES public.files(id) ON DELETE SET NULL;

-- Add reminder_email column to notes table
ALTER TABLE public.notes 
ADD COLUMN reminder_email TEXT;

-- Create index for better performance on file_id lookups
CREATE INDEX idx_notes_file_id ON public.notes(file_id);

-- Create index for reminder_email queries
CREATE INDEX idx_notes_reminder_email ON public.notes(reminder_email) WHERE reminder_email IS NOT NULL;