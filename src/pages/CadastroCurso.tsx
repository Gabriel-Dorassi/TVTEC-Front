import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function CadastroCurso() {
  const [form, setForm] = useState({
    nome: "",
    professor: "",
    data: "",
    cargaHoraria: "",
    certificado: "",
    vagasTotais: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataValida = !isNaN(new Date(form.data).getTime());
    if (!dataValida) {
      toast.error("Data inválida. Escolha uma data válida.");
      return;
    }

    const rawDate = new Date(form.data);
    const dataFormatada = rawDate.toLocaleDateString("pt-BR").replace(/-/g, "/"); // "dd/MM/yyyy"

    const dados = {
      nome: form.nome,
      professor: form.professor,
      data: dataFormatada,
      cargaHoraria: Number(form.cargaHoraria),
      certificado: form.certificado,
      vagasTotais: Number(form.vagasTotais),
    };

    try {
      console.log("ENVIANDO DADOS...");
      console.log("Dados enviados: ", dados);

      const res = await fetch("https://cursos-tv.onrender.com/admin/curso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!res.ok) throw new Error("Erro ao cadastrar curso");

      toast.success("Curso cadastrado com sucesso!");
      setForm({ nome: "", professor: "", data: "", cargaHoraria: "", certificado: "", vagasTotais: "" });
    } catch {
      toast.error("Erro ao cadastrar curso. Verifique os dados.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 text-center">Cadastrar Curso</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="nome" placeholder="Nome do curso" value={form.nome} onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="text" name="professor" placeholder="Nome do professor" value={form.professor} onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="date" name="data" placeholder="Data do curso" value={form.data} onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="number" name="cargaHoraria" placeholder="Carga horária (horas)" value={form.cargaHoraria} onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="text" name="certificado" placeholder="Informações do certificado" value={form.certificado} onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="number" name="vagasTotais" placeholder="Número de vagas" value={form.vagasTotais} onChange={handleChange} className="w-full p-2 border rounded" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Cadastrar Curso</button>
      </form>
      <ToastContainer autoClose={3000} hideProgressBar newestOnTop theme="colored" />
    </div>
  );
}
