import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// URLs da API existente
const API_URL = "https://cursos-tv.onrender.com/admin/aluno";
const CURSO_API = "https://cursos-tv.onrender.com/curso";

// Tipos para tipagem do TypeScript
type Aluno = {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  sexo?: string; // Pode ser que a API use "genero" em vez de "sexo"
  genero?: string;
  telefone: string;
  dataNascto?: string; // Pode ser que a API use "nascimento" em vez de "dataNascto"
  nascimento?: string;
  curso?: string; // O aluno pode ter o nome do curso associado
};

type Curso = {
  id: number;
  nome: string;
  professor: string;
  data: string;
  cargaHoraria: number;
  certificado: string;
  vagasTotais: number;
  vagasPreenchidas: number;
};

// Simulação da entidade Inscricao
type Inscricao = {
  id: number;
  alunoId: number;
  cursoId: number;
  dataInscricao: string;
  aluno?: Aluno;
  curso?: Curso;
};

export default function PaginaGerenciamento() {
  // Estados para armazenar dados
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [abaAtiva, setAbaAtiva] = useState("dashboard");
  const [cursoSelecionado, setCursoSelecionado] = useState<number | null>(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("");

  // Estatísticas para o dashboard
  const [estatisticas, setEstatisticas] = useState({
    totalAlunos: 0,
    totalCursos: 0,
    totalInscricoes: 0,
    vagasDisponiveis: 0,
    vagasPreenchidas: 0,
    cursoMaisPopular: "",
    cursoComMaisVagas: ""
  });

  // Função para gerar dados simulados de inscrições com base nos alunos e cursos
  const gerarInscricoesSimuladas = (alunos: Aluno[], cursos: Curso[]): Inscricao[] => {
    const inscricoesSimuladas: Inscricao[] = [];
    let inscricaoId = 1;
    
    // Para cada aluno, vamos tentar encontrar o curso associado (se existir)
    alunos.forEach(aluno => {
      // Se o aluno tem um campo 'curso', tentamos encontrar esse curso
      if (aluno.curso) {
        const cursoAssociado = cursos.find(c => c.nome === aluno.curso);
        if (cursoAssociado) {
          inscricoesSimuladas.push({
            id: inscricaoId++,
            alunoId: aluno.id,
            cursoId: cursoAssociado.id,
            dataInscricao: new Date().toISOString(), // Data atual como simulação
            aluno: aluno,
            curso: cursoAssociado
          });
        }
      } else {
        // Se não há curso associado ao aluno, podemos atribuir aleatoriamente
        // Apenas para fins de demonstração
        if (cursos.length > 0 && Math.random() > 0.3) { // 70% de chance de ter um curso
          const cursoAleatorio = cursos[Math.floor(Math.random() * cursos.length)];
          inscricoesSimuladas.push({
            id: inscricaoId++,
            alunoId: aluno.id,
            cursoId: cursoAleatorio.id,
            dataInscricao: new Date().toISOString(),
            aluno: aluno,
            curso: cursoAleatorio
          });
        }
      }
    });
    
    return inscricoesSimuladas;
  };

  // Função para carregar todos os dados necessários
  const carregarDados = async () => {
    setCarregando(true);
    try {

      const token = localStorage.getItem("token");

      // Carregar cursos
      const resCursos = await fetch(`${CURSO_API}`);
      if (!resCursos.ok) throw new Error("Erro ao carregar cursos");
      const dadosCursos = await resCursos.json();
      setCursos(dadosCursos);
      console.log("Cursos carregados:", dadosCursos);

      // Carregar alunos
      const resAlunos = await fetch(`${API_URL}`,{
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!resAlunos.ok) throw new Error("Erro ao carregar alunos");
      const dadosAlunos = await resAlunos.json();
      setAlunos(dadosAlunos);
      console.log("Alunos carregados:", dadosAlunos);

      // Gerar dados simulados de inscrições (já que o endpoint não existe)
      const inscricoesSimuladas = gerarInscricoesSimuladas(dadosAlunos, dadosCursos);
      setInscricoes(inscricoesSimuladas);
      console.log("Inscrições simuladas:", inscricoesSimuladas);

      // Calcular estatísticas
      calcularEstatisticas(dadosCursos, dadosAlunos, inscricoesSimuladas);
      
      // Notificar o usuário que estamos usando dados simulados
      toast.info("Alguns dados de inscrições são simulados para fins de demonstração", {
        position: "top-center",
        autoClose: 5000
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  // Calcular estatísticas para o dashboard
  const calcularEstatisticas = (cursos: Curso[], alunos: Aluno[], inscricoes: Inscricao[]) => {
    // Total de vagas disponíveis e preenchidas
    let vagasDisponiveis = 0;
    let vagasPreenchidas = 0;
    
    // Encontrar curso mais popular e com mais vagas
    let cursoMaisPopular = { nome: "", inscricoes: 0 };
    let cursoComMaisVagas = { nome: "", vagas: 0 };
    
    // Contagem de inscrições por curso
    const inscricoesPorCurso: Record<number, number> = {};
    
    inscricoes.forEach(inscricao => {
      if (!inscricoesPorCurso[inscricao.cursoId]) {
        inscricoesPorCurso[inscricao.cursoId] = 0;
      }
      inscricoesPorCurso[inscricao.cursoId]++;
    });
    
    cursos.forEach(curso => {
      vagasDisponiveis += (curso.vagasTotais - curso.vagasPreenchidas);
      vagasPreenchidas += curso.vagasPreenchidas;
      
      const inscricoesCurso = inscricoesPorCurso[curso.id] || 0;
      
      if (inscricoesCurso > cursoMaisPopular.inscricoes) {
        cursoMaisPopular = { nome: curso.nome, inscricoes: inscricoesCurso };
      }
      
      const vagasRestantes = curso.vagasTotais - curso.vagasPreenchidas;
      if (vagasRestantes > cursoComMaisVagas.vagas) {
        cursoComMaisVagas = { nome: curso.nome, vagas: vagasRestantes };
      }
    });
    
    setEstatisticas({
      totalAlunos: alunos.length,
      totalCursos: cursos.length,
      totalInscricoes: inscricoes.length,
      vagasDisponiveis,
      vagasPreenchidas,
      cursoMaisPopular: cursoMaisPopular.nome || "Nenhum",
      cursoComMaisVagas: cursoComMaisVagas.nome || "Nenhum"
    });
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados();
  }, []);

  // Carregar detalhes de um curso específico
  const carregarDetalhesCurso = (cursoId: number) => {
    const curso = cursos.find(c => c.id === cursoId);
    if (!curso) {
      toast.error("Curso não encontrado");
      return;
    }
    
    // Filtrar as inscrições relacionadas a este curso
    const inscricoesCurso = inscricoes.filter(i => i.cursoId === cursoId);
    
    setCursoSelecionado(cursoId);
    setAbaAtiva("detalheCurso");
  };

  // Carregar detalhes de um aluno específico
  const carregarDetalhesAluno = (alunoId: number) => {
    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) {
      toast.error("Aluno não encontrado");
      return;
    }
    
    // Filtrar as inscrições relacionadas a este aluno
    const inscricoesAluno = inscricoes.filter(i => i.alunoId === alunoId);
    
    setAlunoSelecionado(alunoId);
    setAbaAtiva("detalheAluno");
  };

  // Renderizar o conteúdo conforme a aba ativa
  const renderizarConteudo = () => {
    switch (abaAtiva) {
      case "dashboard":
        return renderizarDashboard();
      case "cursos":
        return renderizarListaCursos();
      case "alunos":
        return renderizarListaAlunos();
      case "detalheCurso":
        return renderizarDetalheCurso();
      case "detalheAluno":
        return renderizarDetalheAluno();
      default:
        return renderizarDashboard();
    }
  };

  // Renderizar o dashboard com estatísticas
  const renderizarDashboard = () => (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Painel de Controle</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card de Total de Alunos */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
          <h3 className="text-gray-500 text-sm uppercase font-semibold">Total de Alunos</h3>
          <p className="text-3xl font-bold text-gray-800">{estatisticas.totalAlunos}</p>
        </div>
        
        {/* Card de Total de Cursos */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
          <h3 className="text-gray-500 text-sm uppercase font-semibold">Total de Cursos</h3>
          <p className="text-3xl font-bold text-gray-800">{estatisticas.totalCursos}</p>
        </div>
        
        {/* Card de Inscrições */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500">
          <h3 className="text-gray-500 text-sm uppercase font-semibold">Total de Inscrições</h3>
          <p className="text-3xl font-bold text-gray-800">{estatisticas.totalInscricoes}</p>
        </div>
        
        {/* Card de Vagas Disponíveis */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm uppercase font-semibold">Vagas Disponíveis</h3>
          <p className="text-3xl font-bold text-gray-800">{estatisticas.vagasDisponiveis}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações de Cursos */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Informações de Cursos</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-gray-600 font-medium">Curso Mais Popular</h4>
              <p className="text-xl">{estatisticas.cursoMaisPopular}</p>
            </div>
            
            <div>
              <h4 className="text-gray-600 font-medium">Curso com Mais Vagas</h4>
              <p className="text-xl">{estatisticas.cursoComMaisVagas}</p>
            </div>
            
            <div className="flex justify-between">
              <div>
                <h4 className="text-gray-600 font-medium">Vagas Preenchidas</h4>
                <p className="text-xl">{estatisticas.vagasPreenchidas}</p>
              </div>
              <div>
                <h4 className="text-gray-600 font-medium">Taxa de Ocupação</h4>
                <p className="text-xl">
                  {estatisticas.vagasPreenchidas + estatisticas.vagasDisponiveis > 0 
                    ? Math.round((estatisticas.vagasPreenchidas / (estatisticas.vagasPreenchidas + estatisticas.vagasDisponiveis)) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Ações Rápidas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
          
          <div className="space-y-4">
            <button 
              onClick={() => setAbaAtiva("cursos")}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-between hover:bg-blue-700 transition"
            >
              <span>Ver Todos os Cursos</span>
              <span>→</span>
            </button>
            
            <button 
              onClick={() => setAbaAtiva("alunos")}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-between hover:bg-green-700 transition"
            >
              <span>Ver Todos os Alunos</span>
              <span>→</span>
            </button>
            
            <button 
              onClick={() => window.location.href = "/"}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg flex items-center justify-between hover:bg-purple-700 transition"
            >
              <span>Nova Inscrição</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar lista de cursos
  const renderizarListaCursos = () => {
    const cursosFiltrados = cursos.filter(curso => 
      curso.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      curso.professor.toLowerCase().includes(filtro.toLowerCase())
    );
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gerenciamento de Cursos</h2>
          <button 
            onClick={() => setAbaAtiva("dashboard")}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Voltar ao Dashboard
          </button>
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Pesquisar cursos..."
            className="w-full p-3 border rounded-lg"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carga Horária</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vagas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cursosFiltrados.map(curso => (
                <tr key={curso.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{curso.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{curso.professor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{curso.data.split("T")[0]}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {curso.cargaHoraria}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {curso.vagasPreenchidas}/{curso.vagasTotais}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${(curso.vagasPreenchidas / curso.vagasTotais) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => carregarDetalhesCurso(curso.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Renderizar lista de alunos
  const renderizarListaAlunos = () => {
    const alunosFiltrados = alunos.filter(aluno => 
      aluno.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      aluno.cpf.includes(filtro) ||
      aluno.email.toLowerCase().includes(filtro.toLowerCase())
    );
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gerenciamento de Alunos</h2>
          <button 
            onClick={() => setAbaAtiva("dashboard")}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Voltar ao Dashboard
          </button>
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Pesquisar alunos..."
            className="w-full p-3 border rounded-lg"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gênero/Sexo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alunosFiltrados.map(aluno => (
                <tr key={aluno.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{aluno.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{aluno.cpf}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{aluno.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {aluno.sexo || aluno.genero || "Não informado"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {aluno.telefone || "Não informado"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => carregarDetalhesAluno(aluno.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Renderizar detalhes de um curso específico
  const renderizarDetalheCurso = () => {
    if (!cursoSelecionado) return null;
    
    const curso = cursos.find(c => c.id === cursoSelecionado);
    if (!curso) return null;
    
    // Pegar as inscrições deste curso
    const inscricoesDoCurso = inscricoes.filter(i => i.cursoId === cursoSelecionado);
    
    // Pegar os alunos inscritos neste curso
    const alunosInscritos = inscricoesDoCurso.map(inscricao => {
      const aluno = alunos.find(a => a.id === inscricao.alunoId);
      return { ...inscricao, aluno };
    });
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Detalhes do Curso</h2>
          <button 
            onClick={() => setAbaAtiva("cursos")}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Voltar para Cursos
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{curso.nome}</h3>
              <div className="space-y-3">
                <div className="flex">
                  <span className="text-gray-600 w-32">Professor:</span>
                  <span className="font-medium">{curso.professor}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Data:</span>
                  <span className="font-medium">{curso.data.split("T")[0]}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Carga Horária:</span>
                  <span className="font-medium">{curso.cargaHoraria}h</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Certificado:</span>
                  <span className="font-medium">{curso.certificado}</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="text-md font-semibold mb-2">Status de Ocupação</h4>
                <div className="flex justify-between mb-2">
                  <span>Vagas Preenchidas:</span>
                  <span className="font-medium">{curso.vagasPreenchidas}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span>Vagas Totais:</span>
                  <span className="font-medium">{curso.vagasTotais}</span>
                </div>
                
                <div className="w-full bg-gray-300 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full ${
                      curso.vagasPreenchidas / curso.vagasTotais > 0.8 
                        ? 'bg-red-500' 
                        : curso.vagasPreenchidas / curso.vagasTotais > 0.5 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`} 
                    style={{ width: `${(curso.vagasPreenchidas / curso.vagasTotais) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-sm">
                    {Math.round((curso.vagasPreenchidas / curso.vagasTotais) * 100)}% ocupado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Alunos Inscritos ({alunosInscritos.length})</h3>
            <div className="text-sm text-orange-500">
              * Dados de inscrição simulados
            </div>
          </div>
          
          {alunosInscritos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Inscrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alunosInscritos.map(inscricao => (
                    <tr key={inscricao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {inscricao.aluno?.nome || "Nome não disponível"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {inscricao.aluno?.cpf || "CPF não disponível"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {inscricao.aluno?.email || "Email não disponível"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inscricao.dataInscricao).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => carregarDetalhesAluno(inscricao.alunoId)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver Aluno
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum aluno inscrito neste curso.
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar detalhes de um aluno específico
  const renderizarDetalheAluno = () => {
    if (!alunoSelecionado) return null;
    
    const aluno = alunos.find(a => a.id === alunoSelecionado);
    if (!aluno) return null;
    
    // Pegar as inscrições deste aluno
    const inscricoesDoAluno = inscricoes.filter(i => i.alunoId === alunoSelecionado);
    
    // Pegar os cursos em que o aluno está inscrito
    const cursosInscritos = inscricoesDoAluno.map(inscricao => {
      const curso = cursos.find(c => c.id === inscricao.cursoId);
      return { ...inscricao, curso };
    });
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Detalhes do Aluno</h2>
          <button 
            onClick={() => setAbaAtiva("alunos")}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Voltar para Alunos
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{aluno.nome}</h3>
              <div className="space-y-3">
                <div className="flex">
                  <span className="text-gray-600 w-32">CPF:</span>
                  <span className="font-medium">{aluno.cpf}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Email:</span>
                  <span className="font-medium">{aluno.email}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Telefone:</span>
                  <span className="font-medium">{aluno.telefone || "Não informado"}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Gênero/Sexo:</span>
                  <span className="font-medium">
                    {aluno.sexo || aluno.genero || "Não informado"}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Nascimento:</span>
                  <span className="font-medium">{aluno.dataNascto || aluno.nascimento || "Não informado"}</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="text-md font-semibold mb-2">Resumo de Inscrições</h4>
                <div className="flex justify-between mb-2">
                  <span>Total de Cursos:</span>
                  <span className="font-medium">{cursosInscritos.length}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Curso Atual:</span>
                  <span className="font-medium">
                    {aluno.curso || (cursosInscritos.length > 0 ? cursosInscritos[0].curso?.nome : "Nenhum")}
                  </span>
                </div>
                <div className="mt-4 text-sm text-orange-500">
                  * Dados de inscrição simulados
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Cursos Inscritos ({cursosInscritos.length})</h3>
          
          {cursosInscritos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Inscrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cursosInscritos.map(inscricao => (
                    <tr key={inscricao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {inscricao.curso?.nome || "Curso não disponível"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {inscricao.curso?.professor || "Professor não disponível"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {inscricao.curso?.data 
                            ? inscricao.curso.data.split("T")[0] 
                            : "Data não disponível"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inscricao.dataInscricao).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => carregarDetalhesCurso(inscricao.cursoId)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver Curso
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Este aluno não está inscrito em nenhum curso.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Gerenciamento</h1>
            <div className="flex space-x-4">
              <button 
                onClick={() => {setAbaAtiva("dashboard"); setFiltro("");}}
                className={`px-4 py-2 rounded-md ${abaAtiva === "dashboard" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => {setAbaAtiva("cursos"); setFiltro("");}}
                className={`px-4 py-2 rounded-md ${abaAtiva === "cursos" || abaAtiva === "detalheCurso" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Cursos
              </button>
              <button 
                onClick={() => {setAbaAtiva("alunos"); setFiltro("");}}
                className={`px-4 py-2 rounded-md ${abaAtiva === "alunos" || abaAtiva === "detalheAluno" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Alunos
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {carregando ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          renderizarConteudo()
        )}
      </main>
      
      <ToastContainer autoClose={3000} hideProgressBar newestOnTop theme="colored" />
    </div>
  );
}