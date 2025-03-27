import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://cursos-tv.onrender.com/curso";

export default function CadastroCurso() {
  const [form, setForm] = useState({
    nome: "",
    professor: "",
    data: "",
    cargaHoraria: "",
    certificado: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();

    console.log("ENVIANDO DADOS...");

    try {
      const token = localStorage.getItem("token");

      const body = {
        nome: form.nome,
        professor: form.professor,
        data: new Date(form.data).toISOString(),
        cargaHoraria: parseInt(form.cargaHoraria),
        certificado: form.certificado,
      };

      console.log("Dados enviados:", body);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erro ao cadastrar curso");

      toast.success("Curso cadastrado com sucesso!", { position: "top-center" });
      setForm({ nome: "", professor: "", data: "", cargaHoraria: "", certificado: "" });
    } catch (err) {
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