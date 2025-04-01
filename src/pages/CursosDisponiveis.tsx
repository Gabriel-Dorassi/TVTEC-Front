import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

// Constantes das URLs da API
const BASE_URL = "https://cursos-tv.onrender.com";
const CURSO_URL = `${BASE_URL}/curso`;
const ADMIN_URL = `${BASE_URL}/admin`;

// Serviço de API corrigido com o caminho de admin
const apiService = {
  // Buscar todos os cursos (endpoint público)
  getCursos: async () => {
    try {
      const response = await fetch(CURSO_URL);
      if (!response.ok) {
        throw new Error(`API respondeu com status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      throw error;
    }
  },

  // Excluir um curso usando o caminho ADMIN correto
  deleteCurso: async (id: number) => {
    try {
      // URL correta com prefixo /admin conforme o backend
      const url = `${ADMIN_URL}/curso/${id}`;
      const token = localStorage.getItem("token") || "";
      
      console.log(`Enviando requisição DELETE para ${url}`);
      
      // A rota requer autenticação de administrador
      const options: RequestInit = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token é obrigatório para rotas de admin
        }
      };

      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na resposta: ${response.status} - ${errorText}`);
        throw new Error(`API respondeu com status ${response.status}: ${errorText}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      throw error;
    }
  }
};

export default function CursosDisponiveis() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [deletandoId, setDeletandoId] = useState<number | null>(null);
  const isAuthenticated = localStorage.getItem("auth") === "true";
  const usuario = localStorage.getItem("usuario") || "Administrador";

  const carregarCursos = async () => {
    setCarregando(true);
    try {
      const dados = await apiService.getCursos();
      setCursos(dados);
      setErro("");
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      setErro("Erro ao carregar cursos");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarCursos();
  }, []);

  const verificarStatus = (inicio: string) => {
    if (!inicio) return "Data inválida";
    const hoje = new Date();
    const dataInicio = new Date(inicio);
    return hoje <= dataInicio ? "Inscrições abertas" : "Encerradas";
  };

  const vagasAbertas = (curso: any) => {
    const preenchidas = curso.vagasPreenchidas ?? 0;
    const totais = curso.vagasTotais ?? 0;
    return totais - preenchidas > 0;
  };

  const formatarData = (data: string) => {
    if (!data) return "Data não definida";
    const d = new Date(data);
    return d.toLocaleDateString("pt-BR");
  };

  const apagarCurso = async (id: number, nome: string) => {
    const confirmado = window.confirm(`Tem certeza que deseja apagar o curso "${nome}"? Essa ação não poderá ser desfeita.`);
    if (!confirmado) return;

    try {
      setDeletandoId(id);
      
      // Token é necessário por ser uma rota de admin
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Você precisa estar autenticado como administrador para excluir cursos");
        return;
      }
      
      // Chama o serviço para excluir o curso
      await apiService.deleteCurso(id);
      
      toast.success(`Curso "${nome}" removido com sucesso`);
      await carregarCursos();
    } catch (error) {
      console.error("Erro ao apagar curso:", error);
      toast.error("Erro ao apagar curso. Verifique se você tem permissões de administrador.");
    } finally {
      setDeletandoId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 text-center">Cursos Disponíveis</h1>
      {erro && <p className="text-red-600 text-center">{erro}</p>}
      
      {carregando && !cursos.length && <p className="text-center my-4">Carregando cursos...</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        {cursos.map((curso, index) => {
          const status = verificarStatus(curso.data);
          const podeInscrever = vagasAbertas(curso) && status === "Inscrições abertas";
          const estaDeletando = deletandoId === curso.id;
          
          return (
            <div key={index} className="border p-4 rounded shadow-md bg-white relative">
              <h2 className="text-lg font-semibold mb-2">{curso.nome}</h2>
              <p><strong>Professor:</strong> {curso.professor}</p>
              <p><strong>Início:</strong> {formatarData(curso.data)}</p>
              <p><strong>Carga horária:</strong> {curso.cargaHoraria}h</p>
              <p><strong>Certificado:</strong> {curso.certificado}</p>
              <p><strong>Vagas:</strong> {curso.vagasPreenchidas ?? 0}/{curso.vagasTotais ?? 0}</p>
              <p className={`font-semibold ${podeInscrever ? "text-green-600" : "text-red-600"}`}>
                {podeInscrever ? "Vagas abertas" : "Encerradas"}
              </p>
              {podeInscrever ? (
                <Link
                  to={`/cursos/${curso.id}`}
                  className="block text-center mt-3 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  Inscrever-se
                </Link>
              ) : (
                <button
                  disabled
                  className="block w-full text-center mt-3 py-2 rounded text-white bg-gray-400 cursor-not-allowed"
                >
                  Indisponível
                </button>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => apagarCurso(curso.id, curso.nome)}
                  className="absolute top-2 right-2 text-sm bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  disabled={carregando || estaDeletando}
                >
                  {estaDeletando ? "Excluindo..." : "Apagar"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!carregando && cursos.length === 0 && (
        <p className="text-center my-8 text-gray-600">
          Nenhum curso disponível no momento.
        </p>
      )}
    </div>
  );
}