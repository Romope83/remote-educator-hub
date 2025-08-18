import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, BookOpen, Trash2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Turma {
  id: string;
  name: string;
  description: string | null;
  grade_level: string | null;
  subject: string | null;
  created_at: string;
  updated_at: string;
}

interface TurmasManagerProps {
  onStatsChange: () => void;
}

export const TurmasManager = ({ onStatsChange }: TurmasManagerProps) => {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grade_level: '',
    subject: ''
  });

  useEffect(() => {
    loadTurmas();
  }, [user]);

  const loadTurmas = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading turmas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as turmas.",
        variant: "destructive"
      });
    } else {
      setTurmas(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const turmaData = {
      name: formData.name,
      description: formData.description || null,
      grade_level: formData.grade_level || null,
      subject: formData.subject || null,
      teacher_id: user.id
    };

    if (editingTurma) {
      const { error } = await supabase
        .from('turmas')
        .update(turmaData)
        .eq('id', editingTurma.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a turma.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Turma atualizada com sucesso!"
        });
        loadTurmas();
        onStatsChange();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('turmas')
        .insert([turmaData]);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar a turma.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Turma criada com sucesso!"
        });
        loadTurmas();
        onStatsChange();
        resetForm();
      }
    }
  };

  const handleDelete = async (turmaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.')) {
      return;
    }

    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', turmaId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a turma.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Turma excluída com sucesso!"
      });
      loadTurmas();
      onStatsChange();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      grade_level: '',
      subject: ''
    });
    setEditingTurma(null);
    setIsDialogOpen(false);
  };

  const startEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      name: turma.name,
      description: turma.description || '',
      grade_level: turma.grade_level || '',
      subject: turma.subject || ''
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gerenciar Turmas</h2>
          <p className="text-muted-foreground">
            Organize e gerencie suas turmas escolares
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-button)' }}
              onClick={() => resetForm()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTurma ? 'Editar Turma' : 'Nova Turma'}
                </DialogTitle>
                <DialogDescription>
                  {editingTurma 
                    ? 'Edite as informações da turma.' 
                    : 'Preencha as informações para criar uma nova turma.'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Turma *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex: 5º Ano A"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Matéria</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Ex: Matemática"
                    value={formData.subject}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade_level">Série/Ano</Label>
                  <Input
                    id="grade_level"
                    name="grade_level"
                    placeholder="Ex: 5º Ano"
                    value={formData.grade_level}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descrição opcional da turma..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {editingTurma ? 'Atualizar' : 'Criar Turma'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {turmas.length === 0 ? (
        <Card style={{ boxShadow: 'var(--shadow-card)' }}>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma turma encontrada
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              Você ainda não criou nenhuma turma. Comece criando sua primeira turma!
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              style={{ background: 'var(--gradient-primary)' }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Turma
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turmas.map((turma) => (
            <Card key={turma.id} style={{ boxShadow: 'var(--shadow-card)' }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg" style={{ background: 'var(--gradient-primary)' }}>
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{turma.name}</CardTitle>
                      {turma.subject && (
                        <CardDescription>{turma.subject}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(turma)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(turma.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {turma.grade_level && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Série:</strong> {turma.grade_level}
                    </p>
                  )}
                  {turma.description && (
                    <p className="text-sm text-muted-foreground">
                      {turma.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Criada em {new Date(turma.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};