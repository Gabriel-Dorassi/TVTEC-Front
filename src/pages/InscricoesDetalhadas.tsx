import React, { useEffect, useState } from "react";
import { exportToExcel } from "../utils/exportToExcel";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Interface para tipagem das inscrições
interface Aluno {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  sexo: string;
  dataNascto: string;
  telefone: string;
}

interface Curso {
  id: number;
  nome: string;
  professor: string;
  data: string;
  cargaHoraria: number;
  certificado: string;
  vagasTotais: number;
  vagasPreenchidas: number;
}

interface Inscricao {
  id: number;
  aluno: Aluno;
  curso: Curso;
  dataInscricao: string;
  alunoID: number;
  cursoID: number;
}

export default function InscricoesDetalhadas() {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const isAuthenticated = localStorage.getItem("auth") === "true";
  const API_URL = "https://cursos-tv.onrender.com";

  useEffect(() => {
    if (!isAuthenticated) return;

    carregarInscricoes();
  }, [isAuthenticated]);

  const carregarInscricoes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/admin/inscricoes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro na resposta: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setInscricoes(data);
      } else {
        setInscricoes([]);
        toast.error("Resposta inesperada da API.");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      toast.error(`Erro ao carregar inscrições: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString: string) => {
    if (!dataString) return "-";
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const formatarHora = (dataString: string) => {
    if (!dataString) return "-";
    const data = new Date(dataString);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarDataHora = (dataString: string) => {
    if (!dataString) return "-";
    const data = new Date(dataString);
    return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const exportar = () => {
    if (inscricoes.length === 0) return toast.info("Nenhuma inscrição para exportar.");
    
    // Formatar dados para exportação
    const dadosExportacao = inscricoes.map(insc => ({
      'Nome do Aluno': insc.aluno.nome,
      'CPF': insc.aluno.cpf,
      'Email': insc.aluno.email,
      'Telefone': insc.aluno.telefone || "Não informado",
      'Gênero': insc.aluno.sexo,
      'Data de Nascimento': formatarData(insc.aluno.dataNascto),
      'Curso': insc.curso.nome,
      'Professor': insc.curso.professor,
      'Data do Curso': formatarData(insc.curso.data),
      'Carga Horária': insc.curso.cargaHoraria,
      'Data de Inscrição': formatarDataHora(insc.dataInscricao)
    }));
    
    exportToExcel(dadosExportacao, "inscricoes-detalhadas");
    toast.success("Planilha gerada com sucesso!");
  };

  const enviarParaBanco = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_URL}/admin/relatorio`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(inscricoes),
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Erro ${res.status}: ${errorText || res.statusText || "Desconhecido"}`);
      }
      
      toast.success("Relatório de inscrições gerado com sucesso!");
      setEnviado(true);
    } catch (error) {
      console.error("Erro ao enviar para o banco:", error);
      toast.error(`Erro ao gerar relatório: ${error instanceof Error ? error.message : "Desconhecido"}`);
    }
  };

  const removerInscricao = async (id: number) => {
    if (!confirm("Tem certeza que deseja cancelar esta inscrição?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_URL}/admin/inscricoes/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Erro ${res.status}: ${errorText || res.statusText || "Desconhecido"}`);
      }
      
      toast.success("Inscrição cancelada com sucesso");
      
      // Recarregar a lista de inscrições
      carregarInscricoes();
    } catch (error) {
      console.error("Erro ao cancelar inscrição:", error);
      toast.error(`Erro ao cancelar inscrição: ${error instanceof Error ? error.message : "Desconhecido"}`);
    }
  };

  // Função para alternar a expansão de uma linha
  const toggleExpansao = (id: number) => {
    if (expandido === id) {
      setExpandido(null);
    } else {
      setExpandido(id);
    }
  };

  // Filtrar inscrições com base no texto de busca
  const inscricoesFiltradas = inscricoes.filter(insc => 
    insc.aluno.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    insc.aluno.cpf.includes(filtro) ||
    insc.aluno.email.toLowerCase().includes(filtro.toLowerCase()) ||
    insc.curso.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  if (!isAuthenticated) return <p className="text-center mt-10">Você precisa estar logado para visualizar.</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold">Inscrições Detalhadas</h1>
        <div className="flex gap-3">
          <button 
            onClick={exportar} 
            disabled={inscricoes.length === 0 || loading}
            className={`px-4 py-2 rounded text-white ${
              inscricoes.length === 0 || loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Exportar Excel
          </button>
          <button
            onClick={enviarParaBanco}
            disabled={enviado || inscricoes.length === 0 || loading}
            className={`px-4 py-2 rounded text-white ${
              enviado || inscricoes.length === 0 || loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {enviado ? "Relatório Gerado ✔" : "Gerar Relatório"}
          </button>
          <button
            onClick={carregarInscricoes}
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </div>
      </div>

      {/* Campo de busca */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nome, CPF, email ou curso..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : inscricoes.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          Nenhuma inscrição encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2 w-10"></th>
                <th className="border p-2">Nome do Aluno</th>
                <th className="border p-2">CPF</th>
                <th className="border p-2">Curso</th>
                <th className="border p-2">Data de Inscrição</th>
                <th className="border p-2 w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {inscricoesFiltradas.map((inscricao) => (
                <React.Fragment key={inscricao.id}>
                  <tr 
                    className={`hover:bg-gray-100 cursor-pointer ${expandido === inscricao.id ? 'bg-blue-50' : ''}`}
                    onClick={() => toggleExpansao(inscricao.id)}
                  >
                    <td className="border p-2 text-center">
                      <button className="text-blue-600 font-bold">
                        {expandido === inscricao.id ? '▼' : '▶'}
                      </button>
                    </td>
                    <td className="border p-2">{inscricao.aluno.nome}</td>
                    <td className="border p-2">{inscricao.aluno.cpf}</td>
                    <td className="border p-2">{inscricao.curso.nome}</td>
                    <td className="border p-2">{formatarDataHora(inscricao.dataInscricao)}</td>
                    <td className="border p-2 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Evita expandir ao clicar no botão
                          removerInscricao(inscricao.id);
                        }}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-sm"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                  {expandido === inscricao.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="p-4 border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-bold text-blue-800 mb-2">Dados do Aluno</h3>
                            <p><strong>Email:</strong> {inscricao.aluno.email}</p>
                            <p><strong>Telefone:</strong> {inscricao.aluno.telefone || "Não informado"}</p>
                            <p><strong>Gênero:</strong> {inscricao.aluno.sexo}</p>
                            <p><strong>Data de Nascimento:</strong> {formatarData(inscricao.aluno.dataNascto)}</p>
                          </div>
                          
                          <div>
                            <h3 className="font-bold text-blue-800 mb-2">Dados do Curso</h3>
                            <p><strong>Professor:</strong> {inscricao.curso.professor}</p>
                            <p><strong>Data do Curso:</strong> {formatarData(inscricao.curso.data)}</p>
                            <p><strong>Carga Horária:</strong> {inscricao.curso.cargaHoraria}h</p>
                            <p><strong>Certificado:</strong> {inscricao.curso.certificado}</p>
                            <p><strong>Vagas Preenchidas:</strong> {inscricao.curso.vagasPreenchidas} de {inscricao.curso.vagasTotais}</p>
                          </div>
                          
                          <div className="md:col-span-2">
                            <h3 className="font-bold text-blue-800 mb-2">Dados da Inscrição</h3>
                            <p><strong>Data:</strong> {formatarData(inscricao.dataInscricao)}</p>
                            <p><strong>Hora:</strong> {formatarHora(inscricao.dataInscricao)}</p>
                            <p><strong>ID da Inscrição:</strong> {inscricao.id}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          <div className="mt-4 text-gray-600">
            Mostrando {inscricoesFiltradas.length} de {inscricoes.length} inscrições
          </div>
        </div>
      )}

      <ToastContainer autoClose={3000} hideProgressBar newestOnTop theme="colored" />
    </div>
  );
}