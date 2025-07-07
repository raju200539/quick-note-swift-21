-- Create a table for notes with user authentication
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own notes" 
ON public.notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create a table for file uploads
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create policies for file access
CREATE POLICY "Users can view their own files" 
ON public.files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own files" 
ON public.files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" 
ON public.files 
FOR DELETE 
USING (auth.uid() = user_id);