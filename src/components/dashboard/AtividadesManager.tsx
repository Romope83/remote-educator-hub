import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, Calendar, Trash2, Edit, Clock, CheckCircle, Circle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Atividade {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  turma_id: string;
  created_at: string;
  updated_at: string;
  turmas: {
    name: string;
  };
}

interface Turma {
  id: string;
  name: string;
}

interface AtividadesManagerProps {
  onStatsChange: () => void;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Circle },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-500', icon: Clock },
  completed: { label: 'Concluída', color: 'bg-green-500', icon: CheckCircle }
};

export const AtividadesManager = ({ onStatsChange }: AtividadesManagerProps) => {
  const { user } = useAuth();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAtividade, setEditingAtividade] = useState<Atividade | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    turma_id: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    
    // Load turmas
    const { data: turmasData, error: turmasError } = await supabase
      .from('turmas')
      .select('id, name')
      .eq('teacher_id', user.id);

    if (turmasError) {
      console.error('Error loading turmas:', turmasError);
    } else {
      setTurmas(turmasData || []);
    }

    // Load atividades with turma names
    const { data: atividadesData, error: atividadesError } = await supabase
      .from('atividades')
      .select(`
        *,
        turmas (name)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (atividadesError) {
      console.error('Error loading atividades:', atividadesError);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as atividades.",
        variant: "destructive"
      });
    } else {
      setAtividades((atividadesData || []) as Atividade[]);
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const atividadeData = {
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null,
      status: formData.status,
      turma_id: formData.turma_id,
      teacher_id: user.id
    };

    if (editingAtividade) {
      const { error } = await supabase
        .from('atividades')
        .update(atividadeData)
        .eq('id', editingAtividade.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a atividade.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Atividade atualizada com sucesso!"
        });
        loadData();
        onStatsChange();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('atividades')
        .insert([atividadeData]);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar a atividade.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Atividade criada com sucesso!"
        });
        loadData();
        onStatsChange();
        resetForm();
      }
    }
  };

  const handleDelete = async (atividadeId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.')) {
      return;
    }

    const { error } = await supabase
      .from('atividades')
      .delete()
      .eq('id', atividadeId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a atividade.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Atividade excluída com sucesso!"
      });
      loadData();
      onStatsChange();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      status: 'pending',
      turma_id: ''
    });
    setEditingAtividade(null);
    setIsDialogOpen(false);
  };

  const startEdit = (atividade: Atividade) => {
    setEditingAtividade(atividade);
    setFormData({
      title: atividade.title,
      description: atividade.description || '',
      due_date: atividade.due_date || '',
      status: atividade.status,
      turma_id: atividade.turma_id
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
          <h2 className="text-3xl font-bold text-foreground">Gerenciar Atividades</h2>
          <p className="text-muted-foreground">
            Organize e acompanhe as atividades de suas turmas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              style={{ background: 'var(--gradient-secondary)', boxShadow: 'var(--shadow-button)' }}
              onClick={() => resetForm()}
              disabled={turmas.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Atividade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingAtividade ? 'Editar Atividade' : 'Nova Atividade'}
                </DialogTitle>
                <DialogDescription>
                  {editingAtividade 
                    ? 'Edite as informações da atividade.' 
                    : 'Preencha as informações para criar uma nova atividade.'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Atividade *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Ex: Lista de Exercícios - Matemática"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="turma_id">Turma *</Label>
                  <Select value={formData.turma_id} onValueChange={(value) => setFormData(prev => ({ ...prev, turma_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Entrega</Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Detalhes da atividade..."
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
                  style={{ background: 'var(--gradient-secondary)' }}
                >
                  {editingAtividade ? 'Atualizar' : 'Criar Atividade'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {turmas.length === 0 ? (
        <Card style={{ boxShadow: 'var(--shadow-card)' }}>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma turma encontrada
            </h3>
            <p className="text-muted-foreground text-center">
              Você precisa criar pelo menos uma turma antes de adicionar atividades.
            </p>
          </CardContent>
        </Card>
      ) : atividades.length === 0 ? (
        <Card style={{ boxShadow: 'var(--shadow-card)' }}>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma atividade encontrada
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              Você ainda não criou nenhuma atividade. Comece criando sua primeira atividade!
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              style={{ background: 'var(--gradient-secondary)' }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Atividade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {atividades.map((atividade) => {
            const statusInfo = statusConfig[atividade.status];
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={atividade.id} style={{ boxShadow: 'var(--shadow-card)' }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg" style={{ background: 'var(--gradient-secondary)' }}>
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{atividade.title}</CardTitle>
                        <CardDescription>{atividade.turmas.name}</CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(atividade)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(atividade.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusInfo.label}</span>
                      </Badge>
                      {atividade.due_date && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(atividade.due_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                    
                    {atividade.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {atividade.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Criada em {new Date(atividade.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};