import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, BookOpen, Calendar, LogOut } from 'lucide-react';
import { TurmasManager } from './TurmasManager';
import { AtividadesManager } from './AtividadesManager';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string;
  school_name: string | null;
}

interface DashboardStats {
  totalTurmas: number;
  totalAtividades: number;
  atividadesPendentes: number;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTurmas: 0,
    totalAtividades: 0,
    atividadesPendentes: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'turmas' | 'atividades'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadStats();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
    } else {
      setProfile(data);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      // Load turmas count
      const { count: turmasCount } = await supabase
        .from('turmas')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id);

      // Load atividades count
      const { count: atividadesCount } = await supabase
        .from('atividades')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id);

      // Load pending atividades count
      const { count: pendingCount } = await supabase
        .from('atividades')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .eq('status', 'pending');

      setStats({
        totalTurmas: turmasCount || 0,
        totalAtividades: atividadesCount || 0,
        atividadesPendentes: pendingCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Não foi possível fazer o logout.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/20 bg-card" style={{ boxShadow: 'var(--shadow-soft)' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg" style={{ background: 'var(--gradient-primary)' }}>
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Educador Remoto</h1>
                <p className="text-muted-foreground">Bem-vindo, {profile?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-border/20 bg-card">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Calendar },
              { id: 'turmas', label: 'Turmas', icon: Users },
              { id: 'atividades', label: 'Atividades', icon: BookOpen }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
              <p className="text-muted-foreground">
                Acompanhe suas turmas e atividades em um só lugar
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card style={{ boxShadow: 'var(--shadow-card)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTurmas}</div>
                  <p className="text-xs text-muted-foreground">
                    Turmas ativas no sistema
                  </p>
                </CardContent>
              </Card>

              <Card style={{ boxShadow: 'var(--shadow-card)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Atividades</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAtividades}</div>
                  <p className="text-xs text-muted-foreground">
                    Atividades cadastradas
                  </p>
                </CardContent>
              </Card>

              <Card style={{ boxShadow: 'var(--shadow-card)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Atividades Pendentes</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{stats.atividadesPendentes}</div>
                  <p className="text-xs text-muted-foreground">
                    Precisam de atenção
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card style={{ boxShadow: 'var(--shadow-card)' }}>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>
                    Acesse rapidamente as funcionalidades principais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setActiveTab('turmas')}
                    className="w-full justify-start"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Gerenciar Turmas
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('atividades')}
                    className="w-full justify-start"
                    style={{ background: 'var(--gradient-secondary)' }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Gerenciar Atividades
                  </Button>
                </CardContent>
              </Card>

              <Card style={{ boxShadow: 'var(--shadow-card)' }}>
                <CardHeader>
                  <CardTitle>Informações do Perfil</CardTitle>
                  <CardDescription>
                    Seus dados cadastrais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Nome:</p>
                    <p className="text-sm text-muted-foreground">{profile?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email:</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  {profile?.school_name && (
                    <div>
                      <p className="text-sm font-medium">Escola:</p>
                      <p className="text-sm text-muted-foreground">{profile.school_name}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'turmas' && <TurmasManager onStatsChange={loadStats} />}
        {activeTab === 'atividades' && <AtividadesManager onStatsChange={loadStats} />}
      </main>
    </div>
  );
};