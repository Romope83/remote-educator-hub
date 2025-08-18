-- Create profiles table for teacher information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  school_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create turmas (classes) table
CREATE TABLE public.turmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  grade_level TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on turmas
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

-- Create policies for turmas
CREATE POLICY "Teachers can view their own turmas" 
ON public.turmas 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own turmas" 
ON public.turmas 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own turmas" 
ON public.turmas 
FOR UPDATE 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own turmas" 
ON public.turmas 
FOR DELETE 
USING (auth.uid() = teacher_id);

-- Create atividades (activities) table
CREATE TABLE public.atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on atividades
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

-- Create policies for atividades
CREATE POLICY "Teachers can view their own atividades" 
ON public.atividades 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own atividades" 
ON public.atividades 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own atividades" 
ON public.atividades 
FOR UPDATE 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own atividades" 
ON public.atividades 
FOR DELETE 
USING (auth.uid() = teacher_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_turmas_updated_at
  BEFORE UPDATE ON public.turmas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_atividades_updated_at
  BEFORE UPDATE ON public.atividades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Professor')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();