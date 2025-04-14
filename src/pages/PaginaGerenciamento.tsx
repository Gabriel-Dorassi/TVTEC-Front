import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';

const API_URL = "https://cursos-tv.onrender.com/admin/aluno";
const CURSO_API = "https://cursos-tv.onrender.com/curso";
const ADMIN_API = "https://cursos-tv.onrender.com/admin";

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const RADIAN = Math.PI / 180;

type Aluno = {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  sexo?: string;
  genero?: string;
  telefone: string;
  dataNascto?: string;
  nascimento?: string;
  curso?: string;
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

type Inscricao = {
  id: number;
  alunoId: number;
  cursoId: number;
  dataInscricao: string;
  aluno?: Aluno;
  curso?: Curso;
};

type FiltroAvancado = {
  campo: string;
  operador: string;
  valor: string;
};
// Componente para renderizar labels customizados no gráfico de pizza
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
    >
      {name} ({`${(percent * 100).toFixed(0)}%`})
    </text>
  );
};

export default function PaginaGerenciamento() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [abaAtiva, setAbaAtiva] = useState("dashboard");
  const [cursoSelecionado, setCursoSelecionado] = useState<number | null>(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("");
  
  const [filtrosAvancados, setFiltrosAvancados] = useState<FiltroAvancado[]>([]);
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [dadosExportacao, setDadosExportacao] = useState<any>(null);
  const [periodoFiltro, setPeriodoFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [analiseSelecionada, setAnaliseSelecionada] = useState("ocupacao");

  const [estatisticas, setEstatisticas] = useState({
    totalAlunos: 0,
    totalCursos: 0,
    totalInscricoes: 0,
    vagasDisponiveis: 0,
    vagasPreenchidas: 0,
    cursoMaisPopular: "",
    cursoComMaisVagas: ""
  });
  const prepararDadosExportacao = () => {
    const dadosInscricoes = inscricoes.map(inscricao => {
      const aluno = alunos.find(a => a.id === inscricao.alunoId);
      const curso = cursos.find(c => c.id === inscricao.cursoId);
      
      return {
        inscricaoId: inscricao.id,
        dataInscricao: inscricao.dataInscricao,
        alunoId: inscricao.alunoId,
        alunoNome: aluno?.nome || 'Desconhecido',
        alunoCPF: aluno?.cpf || 'N/A',
        alunoEmail: aluno?.email || 'N/A',
        alunoGenero: aluno?.genero || aluno?.sexo || 'Não informado',
        alunoTelefone: aluno?.telefone || 'N/A',
        alunoNascimento: aluno?.dataNascto || aluno?.nascimento || 'N/A',
        cursoId: inscricao.cursoId,
        cursoNome: curso?.nome || 'Desconhecido',
        cursoProfessor: curso?.professor || 'N/A',
        cursoData: curso?.data ? new Date(curso.data).toLocaleDateString() : 'N/A',
        cursoCargaHoraria: curso?.cargaHoraria || 0,
        cursoVagasTotais: curso?.vagasTotais || 0,
        cursoVagasPreenchidas: curso?.vagasPreenchidas || 0,
        taxaOcupacao: curso ? Math.round((curso.vagasPreenchidas / curso.vagasTotais) * 100) : 0
      };
    });
    
    setDadosExportacao({
      inscricoes: dadosInscricoes,
      alunos: alunos,
      cursos: cursos
    });
    
    return dadosInscricoes;
  };

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const token = localStorage.getItem("token");

      // Carrega os cursos
      const resCursos = await fetch(`${CURSO_API}`);
      if (!resCursos.ok) throw new Error("Erro ao carregar cursos");
      const dadosCursos = await resCursos.json();
      setCursos(dadosCursos);

      // Carrega os alunos
      const resAlunos = await fetch(`${API_URL}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!resAlunos.ok) throw new Error("Erro ao carregar alunos");
      const dadosAlunos = await resAlunos.json();
      setAlunos(dadosAlunos);

      // Carrega as inscrições reais
      const resInscricoes = await fetch(`${ADMIN_API}/inscricoes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!resInscricoes.ok) throw new Error("Erro ao carregar inscrições");
      const dadosInscricoes = await resInscricoes.json();
      setInscricoes(dadosInscricoes);

      // Calcula estatísticas
      calcularEstatisticas(dadosCursos, dadosAlunos, dadosInscricoes);
      
      // Prepara dados para exportação
      prepararDadosExportacao();
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };
  const calcularEstatisticas = (cursos: Curso[], alunos: Aluno[], inscricoes: Inscricao[]) => {
    let vagasDisponiveis = 0;
    let vagasPreenchidas = 0;
    
    let cursoMaisPopular = { nome: "", inscricoes: 0 };
    let cursoComMaisVagas = { nome: "", vagas: 0 };
    
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

  const aplicarFiltrosAvancados = (dados: any[], filtros: FiltroAvancado[]) => {
    if (!filtros || filtros.length === 0) return dados;
    
    return dados.filter((item: any) => {
      return filtros.every(filtro => {
        const valorCampo = item[filtro.campo];
        
        switch (filtro.operador) {
          case 'contem':
            return valorCampo && valorCampo.toString().toLowerCase().includes(filtro.valor.toLowerCase());
          case 'igual':
            return valorCampo === filtro.valor;
          case 'maior':
            return parseFloat(valorCampo) > parseFloat(filtro.valor);
          case 'menor':
            return parseFloat(valorCampo) < parseFloat(filtro.valor);
          case 'entre':
            const [min, max] = filtro.valor.split(',');
            return parseFloat(valorCampo) >= parseFloat(min) && parseFloat(valorCampo) <= parseFloat(max);
          default:
            return true;
        }
      });
    });
  };

  const aplicarFiltroPeriodo = (dados: any[]) => {
    if (periodoFiltro === 'todos') return dados;
    
    const hoje = new Date();
    let dataInicio = new Date();
    
    switch (periodoFiltro) {
      case 'atual':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case 'ultimo':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const ultimoDiaMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
        hoje.setDate(ultimoDiaMesPassado);
        hoje.setMonth(hoje.getMonth() - 1);
        break;
      case 'trimestre':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate());
        break;
      case 'semestre':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, hoje.getDate());
        break;
      case 'ano':
        dataInicio = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate());
        break;
      default:
        return dados;
    }
    
    return dados.filter((item: any) => {
      const dataItem = item.dataInscricao ? new Date(item.dataInscricao) : 
                      (item.data ? new Date(item.data) : null);
      
      if (!dataItem) return true;
      return dataItem >= dataInicio && dataItem <= hoje;
    });
  };

  const aplicarFiltroStatus = (dados: any[]) => {
    if (statusFiltro === 'todos') return dados;
    
    return dados.filter((item: any) => {
      switch (statusFiltro) {
        case 'ativa':
          return new Date(item.dataInscricao).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
        case 'pendente':
          return item.curso && new Date(item.curso.data) > new Date();
        case 'concluida':
          return new Date(item.dataInscricao).getTime() < Date.now() - 180 * 24 * 60 * 60 * 1000;
        case 'cancelada':
          return item.id % 10 === 0;
        default:
          return true;
      }
    });
  };
  const adicionarFiltroAvancado = () => {
    setFiltrosAvancados([...filtrosAvancados, { campo: 'nome', operador: 'contem', valor: '' }]);
  };

  const removerFiltroAvancado = (index: number) => {
    const novosFiltros = [...filtrosAvancados];
    novosFiltros.splice(index, 1);
    setFiltrosAvancados(novosFiltros);
  };

  const atualizarFiltroAvancado = (index: number, campo: string, valor: string) => {
    const novosFiltros = [...filtrosAvancados];
    novosFiltros[index] = { ...novosFiltros[index], [campo]: valor };
    setFiltrosAvancados(novosFiltros);
  };

  const exportarParaCSV = (dados: any[], nomeArquivo: string) => {
    if (!dados || dados.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }
    
    const replacer = (key: string, value: any) => value === null ? '' : value;
    const cabecalho = Object.keys(dados[0]);
    const csv = [
      cabecalho.join(','),
      ...dados.map(row => cabecalho.map(fieldName => 
        JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Arquivo ${nomeArquivo} exportado com sucesso!`);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDetalhesCurso = (cursoId: number) => {
    const curso = cursos.find(c => c.id === cursoId);
    if (!curso) {
      toast.error("Curso não encontrado");
      return;
    }
    
    setCursoSelecionado(cursoId);
    setAbaAtiva("detalheCurso");
  };

  const carregarDetalhesAluno = (alunoId: number) => {
    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) {
      toast.error("Aluno não encontrado");
      return;
    }
    
    setAlunoSelecionado(alunoId);
    setAbaAtiva("detalheAluno");
  };
  // Funções para preparar dados para os gráficos
  const prepararDadosGraficoCursos = () => {
    return cursos.map(curso => ({
      nome: curso.nome.length > 15 ? curso.nome.substring(0, 15) + '...' : curso.nome,
      nomeCompleto: curso.nome, // Para o tooltip
      vagasPreenchidas: curso.vagasPreenchidas,
      vagasDisponiveis: curso.vagasTotais - curso.vagasPreenchidas,
      total: curso.vagasTotais,
      ocupacao: Math.round((curso.vagasPreenchidas / curso.vagasTotais) * 100)
    }));
  };

  const prepararDadosGraficoInscricoes = () => {
    // Agrupar inscrições por mês
    const inscricoesPorMes: Record<string, number> = {};
    
    inscricoes.forEach(inscricao => {
      const data = new Date(inscricao.dataInscricao);
      const chave = `${data.getFullYear()}-${data.getMonth() + 1}`;
      
      if (!inscricoesPorMes[chave]) {
        inscricoesPorMes[chave] = 0;
      }
      
      inscricoesPorMes[chave]++;
    });
    
    // Converter para array para o gráfico
    return Object.entries(inscricoesPorMes)
      .map(([chave, quantidade]) => {
        const [ano, mes] = chave.split('-');
        return {
          mes: `${mes}/${ano}`,
          quantidade
        };
      })
      .sort((a, b) => {
        const [mesA, anoA] = a.mes.split('/');
        const [mesB, anoB] = b.mes.split('/');
        
        const dataA = new Date(parseInt(anoA), parseInt(mesA) - 1);
        const dataB = new Date(parseInt(anoB), parseInt(mesB) - 1);
        
        return dataA.getTime() - dataB.getTime();
      });
  };

  const prepararDadosGraficoDistribuicaoGenero = () => {
    const distribuicao: Record<string, number> = {};
    
    alunos.forEach(aluno => {
      const genero = aluno.genero || aluno.sexo || 'Não informado';
      
      if (!distribuicao[genero]) {
        distribuicao[genero] = 0;
      }
      
      distribuicao[genero]++;
    });
    
    return Object.entries(distribuicao).map(([genero, quantidade]) => ({
      name: genero,
      value: quantidade
    }));
  };

  const prepararDadosGraficoInscricoesPorCurso = () => {
    const inscricoesPorCurso: Record<number, number> = {};
    
    inscricoes.forEach(inscricao => {
      if (!inscricoesPorCurso[inscricao.cursoId]) {
        inscricoesPorCurso[inscricao.cursoId] = 0;
      }
      
      inscricoesPorCurso[inscricao.cursoId]++;
    });
    
    return Object.entries(inscricoesPorCurso).map(([cursoId, quantidade]) => {
      const curso = cursos.find(c => c.id === parseInt(cursoId));
      return {
        nome: curso ? (curso.nome.length > 20 ? curso.nome.substring(0, 20) + '...' : curso.nome) : 'Desconhecido',
        nomeCompleto: curso ? curso.nome : 'Desconhecido',
        quantidade
      };
    }).sort((a, b) => b.quantidade - a.quantidade).slice(0, 10);
  };
  const renderizarPainelFiltrosAvancados = () => {
    if (!mostrarFiltrosAvancados) return null;
    
    const camposDisponiveis = abaAtiva === 'cursos' ? 
      ['nome', 'professor', 'data', 'cargaHoraria', 'vagasTotais', 'vagasPreenchidas'] :
      ['nome', 'cpf', 'email', 'telefone', 'genero', 'sexo', 'dataNascto', 'nascimento'];
    
    const operadoresDisponiveis = [
      { valor: 'contem', rotulo: 'Contém' },
      { valor: 'igual', rotulo: 'Igual a' },
      { valor: 'maior', rotulo: 'Maior que' },
      { valor: 'menor', rotulo: 'Menor que' },
      { valor: 'entre', rotulo: 'Entre (min,max)' }
    ];
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Filtros Avançados</h3>
          <button
            onClick={adicionarFiltroAvancado}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            + Adicionar Filtro
          </button>
        </div>
        
        {filtrosAvancados.length === 0 ? (
          <p className="text-gray-500 text-center">Nenhum filtro adicionado</p>
        ) : (
          <div className="space-y-3">
            {filtrosAvancados.map((filtro, index) => (
              <div key={index} className="flex items-center space-x-2">
                <select
                  value={filtro.campo}
                  onChange={(e) => atualizarFiltroAvancado(index, 'campo', e.target.value)}
                  className="p-2 border rounded"
                >
                  {camposDisponiveis.map(campo => (
                    <option key={campo} value={campo}>{campo}</option>
                  ))}
                </select>
                
                <select
                  value={filtro.operador}
                  onChange={(e) => atualizarFiltroAvancado(index, 'operador', e.target.value)}
                  className="p-2 border rounded"
                >
                  {operadoresDisponiveis.map(op => (
                    <option key={op.valor} value={op.valor}>{op.rotulo}</option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={filtro.valor}
                  onChange={(e) => atualizarFiltroAvancado(index, 'valor', e.target.value)}
                  placeholder="Valor"
                  className="p-2 border rounded flex-grow"
                />
                
                <button
                  onClick={() => removerFiltroAvancado(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
            
            <div className="flex justify-end pt-3">
              <button
                onClick={() => {
                  toast.success("Filtros aplicados com sucesso!");
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderizarAnalisePersonalizada = () => {
    // Dados para os diferentes tipos de análise
    const dadosAnalise = {
      ocupacao: prepararDadosGraficoCursos(),
      tendencias: prepararDadosGraficoInscricoes(),
      demografico: prepararDadosGraficoDistribuicaoGenero(),
      cursosMaisPopulares: prepararDadosGraficoInscricoesPorCurso()
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Análise Personalizada</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium mb-2">Tipo de Análise</h4>
            <select
              className="w-full p-2 border rounded mb-4"
              value={analiseSelecionada}
              onChange={(e) => setAnaliseSelecionada(e.target.value)}
            >
              <option value="ocupacao">Taxa de Ocupação</option>
              <option value="tendencias">Tendências de Inscrição</option>
              <option value="demografico">Perfil Demográfico de Alunos</option>
              <option value="cursosMaisPopulares">Cursos Mais Populares</option>
            </select>
            
            <h4 className="font-medium mb-2">Período de Análise</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <select
                className="p-2 border rounded"
                value={periodoFiltro}
                onChange={(e) => setPeriodoFiltro(e.target.value)}
              >
                <option value="todos">Todos os períodos</option>
                <option value="atual">Mês atual</option>
                <option value="ultimo">Último mês</option>
                <option value="trimestre">Último trimestre</option>
                <option value="semestre">Último semestre</option>
                <option value="ano">Último ano</option>
              </select>
              <button
                onClick={() => {
                  const dadosParaExportar = analiseSelecionada === 'ocupacao' 
                    ? dadosAnalise.ocupacao 
                    : analiseSelecionada === 'tendencias' 
                      ? dadosAnalise.tendencias 
                      : analiseSelecionada === 'demografico'
                        ? dadosAnalise.demografico
                        : dadosAnalise.cursosMaisPopulares;
                        
                  exportarParaCSV(dadosParaExportar, `analise_${analiseSelecionada}.csv`);
                }}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Exportar (CSV)
              </button>
            </div>
          </div>
          
          <div className="col-span-2 h-96">
            {analiseSelecionada === 'ocupacao' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosAnalise.ocupacao}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={100} />
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => 
                      dadosAnalise.ocupacao.find(item => item.nome === label)?.nomeCompleto || label
                    }
                  />
                  <Legend />
                  <Bar dataKey="vagasPreenchidas" name="Vagas Preenchidas" fill="#0088FE" />
                  <Bar dataKey="vagasDisponiveis" name="Vagas Disponíveis" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
            
            {analiseSelecionada === 'tendencias' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dadosAnalise.tendencias}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="quantidade" 
                    name="Nº de Inscrições" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            
            {analiseSelecionada === 'demografico' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosAnalise.demografico}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosAnalise.demografico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {analiseSelecionada === 'cursosMaisPopulares' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                 data={dadosAnalise.cursosMaisPopulares}
                 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => 
                      dadosAnalise.cursosMaisPopulares.find(item => item.nome === label)?.nomeCompleto || label
                    }
                  />
                  <Legend />
                  <Bar dataKey="quantidade" name="Número de Inscrições" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  };
  const renderizarOpcoesFiltro = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Opções de Filtro</h3>
          <button
            onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)}
            className="text-blue-500 hover:text-blue-700"
          >
            {mostrarFiltrosAvancados ? 'Ocultar Filtros Avançados' : 'Mostrar Filtros Avançados'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Período</label>
            <select 
              className="w-full p-2 border rounded"
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
            >
              <option value="todos">Todos os períodos</option>
              <option value="atual">Mês atual</option>
              <option value="ultimo">Último mês</option>
              <option value="trimestre">Último trimestre</option>
              <option value="semestre">Último semestre</option>
              <option value="ano">Último ano</option>
              <option value="personalizado">Período personalizado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Status da Inscrição</label>
            <select 
              className="w-full p-2 border rounded"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="todos">Todos os status</option>
              <option value="ativa">Ativas</option>
              <option value="pendente">Pendentes</option>
              <option value="concluida">Concluídas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Análise</label>
            <select 
              className="w-full p-2 border rounded"
              value={analiseSelecionada}
              onChange={(e) => setAnaliseSelecionada(e.target.value)}
            >
              <option value="ocupacao">Taxa de Ocupação</option>
              <option value="tendencias">Tendências de Inscrição</option>
              <option value="demografico">Perfil Demográfico</option>
              <option value="cursosMaisPopulares">Cursos Mais Populares</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderizarDashboardCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
          <h3 className="text-gray-500 text-sm uppercase font-semibold">Total de Alunos</h3>
          <p className="text-3xl font-bold text-gray-800">{estatisticas.totalAlunos}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
          <h3 className="text-gray-500 text-sm uppercase font-semibold">Total de Cursos</h3>
          <p className="text-3xl font-bold text-gray-800">{estatisticas.totalCursos}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500">
          <h3 className="text-gray-500 text-sm uppercase font-semibold">Total de Inscrições</h3>
          <p className="text-3xl font-bold text-gray-800">{estatisticas.totalInscricoes}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm uppercase font-semibold">Vagas Disponíveis</h3>
          <p className="text-3xl font-bold text-gray-800">{estatisticas.vagasDisponiveis}</p>
        </div>
      </div>
    );
  };
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

  const renderizarDashboard = () => (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Painel de Controle</h2>
      
      {renderizarOpcoesFiltro()}
      {mostrarFiltrosAvancados && renderizarPainelFiltrosAvancados()}
      
      {renderizarDashboardCards()}
      
      {renderizarAnalisePersonalizada()}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              onClick={() => {
                const dadosInscricoes = dadosExportacao?.inscricoes || [];
                exportarParaCSV(dadosInscricoes, 'relatorio_inscricoes.csv');
              }}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg flex items-center justify-between hover:bg-purple-700 transition"
            >
              <span>Exportar Relatório</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  const renderizarListaCursos = () => {
    const cursosFiltrados = cursos.filter(curso => 
      curso.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      curso.professor.toLowerCase().includes(filtro.toLowerCase())
    );
    
    const cursosFiltradosAvancado = aplicarFiltrosAvancados(cursosFiltrados, filtrosAvancados);
    
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
        
        {renderizarOpcoesFiltro()}
        {mostrarFiltrosAvancados && renderizarPainelFiltrosAvancados()}
        
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
              {cursosFiltradosAvancado.map(curso => (
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
  
  const renderizarListaAlunos = () => {
    const alunosFiltrados = alunos.filter(aluno => 
      aluno.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      aluno.cpf.includes(filtro) ||
      aluno.email.toLowerCase().includes(filtro.toLowerCase())
    );
    
    const alunosFiltradosAvancado = aplicarFiltrosAvancados(alunosFiltrados, filtrosAvancados);
    
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
        
        {renderizarOpcoesFiltro()}
        {mostrarFiltrosAvancados && renderizarPainelFiltrosAvancados()}
        
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
              {alunosFiltradosAvancado.map(aluno => (
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
  const renderizarDetalheCurso = () => {
    if (!cursoSelecionado) return null;
    
    const curso = cursos.find(c => c.id === cursoSelecionado);
    if (!curso) return null;
    
    const inscricoesDoCurso = inscricoes.filter(i => i.cursoId === cursoSelecionado);
    
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
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const dadosParaExportar = alunosInscritos.map(inscricao => ({
                    nome: inscricao.aluno?.nome || 'N/A',
                    cpf: inscricao.aluno?.cpf || 'N/A',
                    email: inscricao.aluno?.email || 'N/A',
                    dataInscricao: new Date(inscricao.dataInscricao).toLocaleDateString()
                  }));
                  exportarParaCSV(dadosParaExportar, `alunos_${curso.nome.replace(/\s+/g, '_')}.csv`);
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Exportar Lista
              </button>
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
  const renderizarDetalheAluno = () => {
    if (!alunoSelecionado) return null;
    
    const aluno = alunos.find(a => a.id === alunoSelecionado);
    if (!aluno) return null;
    
    const inscricoesDoAluno = inscricoes.filter(i => i.alunoId === alunoSelecionado);
    
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
      {
        aluno.curso 
          || (cursosInscritos.length > 0 
                ? cursosInscritos[0].curso?.nome 
                : "Nenhum")
      }
    </span>
  </div>

  <div className="mt-4">
    <button
      onClick={() => {
        const dadosParaExportar = {
          nome: aluno.nome,
          cpf: aluno.cpf,
          email: aluno.email,
          telefone: aluno.telefone || "Não informado",
          genero: aluno.sexo || aluno.genero || "Não informado",
          nascimento: aluno.dataNascto || aluno.nascimento || "Não informado",
          cursos: cursosInscritos.map(i => i.curso?.nome || "Desconhecido").join(", ")
        };
        // ação aqui
      }}
      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 w-full"
    >
      Exportar Dados do Aluno
    </button>
  </div>
</div>

              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Cursos Inscritos ({cursosInscritos.length})</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const dadosParaExportar = cursosInscritos.map(inscricao => ({
                      curso: inscricao.curso?.nome || 'N/A',
                      professor: inscricao.curso?.professor || 'N/A',
                      data: inscricao.curso?.data ? inscricao.curso.data.split("T")[0] : 'N/A',
                      dataInscricao: new Date(inscricao.dataInscricao).toLocaleDateString()
                    }));
                    exportarParaCSV(dadosParaExportar, `cursos_${aluno.nome.replace(/\s+/g, '_')}.csv`);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Exportar Lista
                </button>
              </div>
            </div>
            
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

