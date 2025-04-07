import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Try to use a full URL and bypass any interceptors or middleware
// Using a URL that explicitly excludes the admin path
const API_URL = "https://cursos-tv.onrender.com/curso";
// We'll modify our fetch approach to ensure we use the correct URL

export default function CadastroCurso() {
  const [form, setForm] = useState({
    nome: "",
    professor: "",
    data: "",
    cargaHoraria: "",
    certificado: "",
    vagasTotais: "", // Added this field since it's being sent in the request
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();

    console.log("ENVIANDO DADOS...");
    console.log("API URL sendo usada:", API_URL); // Debug URL

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Você não está autenticado. Faça login novamente.", { position: "top-center" });
        console.error("Token não encontrado");
        return;
      }
      
      console.log("Token existe:", !!token); // Check if token exists

      // Format date correctly
      let formattedDate;
      try {
        formattedDate = form.data ? new Date(form.data).toISOString() : '';
        console.log("Data original:", form.data);
        console.log("Data formatada:", formattedDate);
      } catch (error) {
        console.error("Erro ao formatar data:", error);
        formattedDate = form.data;
      }

      const body = {
        nome: form.nome,
        professor: form.professor,
        data: formattedDate,
        cargaHoraria: parseInt(form.cargaHoraria),
        certificado: form.certificado,
        // Use the actual vagasTotais field if available, otherwise fallback to cargaHoraria
        vagasTotais: form.vagasTotais ? parseInt(form.vagasTotais) : parseInt(form.cargaHoraria)
      };

      console.log("Dados enviados:", body);
      
      // Instead of relying on API_URL which might be modified by interceptors,
      // let's construct and log the exact URL we're going to use
      const targetUrl = "https://cursos-tv.onrender.com/curso"; // Direct URL without any possible middleware
      console.log("URL completa sendo usada (bypass):", targetUrl);

      // Check token format - it should be a JWT (starts with eyJ)
      if (token && !token.startsWith("eyJ")) {
        console.warn("Token não parece ser um JWT válido");
      }
      
      // Use a simple fetch with the hardcoded URL
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(body),
      });

      console.log("Status da resposta:", res.status); // Log response status

      if (!res.ok) {
        // Try to get more details about the error
        const errorText = await res.text();
        console.error("Detalhes do erro:", res.status, errorText);
        
        if (res.status === 401) {
          toast.error("Sessão expirada ou não autorizada. Faça login novamente.", { position: "top-center" });
          console.log("Token que está sendo usado:", token);
          
          // Try to detect if we're being redirected to the /admin path
          if (errorText.includes("/admin") || errorText.includes("admin")) {
            console.warn("A API está redirecionando para o endpoint admin. Verifique sua configuração de API.");
            toast.warning("O sistema está tentando acessar uma rota administrativa. Verifique suas permissões.", { position: "top-center" });
          }
        } else {
          throw new Error(`Erro ao cadastrar curso: ${res.status}`);
        }
        return;
      }

      toast.success("Curso cadastrado com sucesso!", { position: "top-center" });
      setForm({ nome: "", professor: "", data: "", cargaHoraria: "", certificado: "", vagasTotais: "" });
    } catch (err) {
      console.error("Erro completo:", err);
      toast.error("Erro ao cadastrar curso. Verifique os campos e tente novamente.", { position: "top-center" });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cadastrar Curso</h1>
      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
        <input
          type="text"
          name="nome"
          placeholder="Nome do curso"
          value={form.nome}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          name="professor"
          placeholder="Nome do professor"
          value={form.professor}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="date"
          name="data"
          value={form.data}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="number"
          name="cargaHoraria"
          placeholder="Carga horária"
          value={form.cargaHoraria}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="number"
          name="vagasTotais"
          placeholder="Vagas totais"
          value={form.vagasTotais}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          name="certificado"
          placeholder="Nome do certificado (ex: certificado-foto.pdf)"
          value={form.certificado}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Cadastrar Curso
        </button>
      </form>
      <ToastContainer autoClose={3000} hideProgressBar newestOnTop theme="colored" />
    </div>
  );
}