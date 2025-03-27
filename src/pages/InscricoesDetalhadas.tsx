import { useEffect, useState } from "react";
import { exportToExcel } from "../utils/exportToExcel";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function InscricoesDetalhadas() {
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = localStorage.getItem("auth") === "true";

  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    const token = localStorage.getItem("token");
    
    fetch("https://cursos-tv.onrender.com/admin/aluno", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro na resposta: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setInscricoes(data);
        } else {
          setInscricoes([]);
          toast.error("Resposta inesperada da API.");
        }
      })
      .catch((error) => {
        console.error("Erro na requisição:", error);
        toast.error(`Erro ao carregar inscrições: ${error.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated]);

  const exportar = () => {
    if (inscricoes.length === 0) return toast.info("Nenhuma inscrição para exportar.");
    exportToExcel(inscricoes, "inscricoes-detalhadas");
    toast.success("Planilha gerada com sucesso!");
  };

  const enviarParaBanco = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch("https://cursos-tv.onrender.com/relatorio", {
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
      
      toast.success("Inscrições enviadas para o banco com sucesso!");
      setEnviado(true);
    } catch (error) {
      console.error("Erro ao enviar para o banco:", error);
      toast.error(`Erro ao enviar dados para o banco: ${error instanceof Error ? error.message : "Desconhecido"}`);
    }
  };

  if (!isAuthenticated) return <p className="text-center mt-10">Você precisa estar logado para visualizar.</p>;

  return (
    <div className="max-w-5xl mx-auto p-4 animate-fade-in">
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
            {enviado ? "Enviado ✔" : "Enviar para Banco"}
          </button>
        </div>
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
                <th className="border p-2">Nome</th>
                <th className="border p-2">CPF</th>
                <th className="border p-2">Curso</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Nascimento</th>
                <th className="border p-2">Gênero</th>
                <th className="border p-2">Data</th>
                <th className="border p-2">Hora</th>
              </tr>
            </thead>
            <tbody>
              {inscricoes.map((aluno, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border p-2">{aluno.nome}</td>
                  <td className="border p-2">{aluno.cpf}</td>
                  <td className="border p-2">{aluno.curso}</td>
                  <td className="border p-2">{aluno.email}</td>
                  <td className="border p-2">{aluno.nascimento}</td>
                  <td className="border p-2">{aluno.genero}</td>
                  <td className="border p-2">{aluno.data}</td>
                  <td className="border p-2">{aluno.hora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ToastContainer autoClose={3000} hideProgressBar newestOnTop theme="colored" />
    </div>
  );
}