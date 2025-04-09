import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { validarCPF } from "../../utils/cpfUtils";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://cursos-tv.onrender.com/aluno";
const CURSO_API = "https://cursos-tv.onrender.com/curso";

export default function InscricaoForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const cursoPreSelecionado = location.state?.cursoPreSelecionado || "";

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    email: "",
    curso: cursoPreSelecionado,
    sexo: "",
    dataNascto: "",
    telefone: "",
    escolaridade: "",
    trabalhando: "",
    bairro: "",
    ehCuidador: "",
    ehPCD: "",
    tipoPCD: "",
    necessitaElevador: "",
    comoSoube: "",
    autorizaWhatsApp: "",
    levaNotebook: ""
  });

  const [cursos, setCursos] = useState<any[]>([]);
  const [erros, setErros] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [mostrarCamposPCD, setMostrarCamposPCD] = useState(false);
  const [mostrarCampoNotebook, setMostrarCampoNotebook] = useState(false);
  const [isMinoridade, setIsMinoridade] = useState(false);

  useEffect(() => {
    const cursoArmazenado = sessionStorage.getItem('cursoPreSelecionado');
    if (cursoArmazenado) {
      setForm(prevForm => ({ ...prevForm, curso: cursoArmazenado }));
      sessionStorage.removeItem('cursoPreSelecionado');
    }
    
    const handleCursoSelecionado = (event: any) => {
      const nomeCurso = event.detail;
      if (nomeCurso) {
        setForm(prevForm => ({ ...prevForm, curso: nomeCurso }));
      }
    };
    
    window.addEventListener('cursoSelecionado', handleCursoSelecionado);
    
    return () => {
      window.removeEventListener('cursoSelecionado', handleCursoSelecionado);
    };
  }, []);

  useEffect(() => {
    fetch(CURSO_API)
      .then((res) => res.json())
      .then((data) => {
        setCursos(data);
      })
      .catch(() => toast.error("Erro ao carregar cursos", { position: "top-center" }));
  }, []);

  useEffect(() => {
    if (cursoPreSelecionado) {
      setForm((prev) => ({ ...prev, curso: cursoPreSelecionado }));
      if (cursoPreSelecionado.toLowerCase().includes("canva")) {
        setMostrarCampoNotebook(true);
      }
    }
  }, [cursoPreSelecionado]);

  useEffect(() => {
    setMostrarCamposPCD(form.ehPCD === "S");
  }, [form.ehPCD]);

  useEffect(() => {
    setMostrarCampoNotebook(form.curso.toLowerCase().includes("canva"));
    
    if (!form.curso.toLowerCase().includes("canva")) {
      setForm(prev => ({ ...prev, levaNotebook: "" }));
    }
  }, [form.curso]);

  useEffect(() => {
    if (form.dataNascto) {
      const dataNascimento = new Date(form.dataNascto);
      const hoje = new Date();
      
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      const mesAtual = hoje.getMonth();
      const diaAtual = hoje.getDate();
      const mesNascimento = dataNascimento.getMonth();
      const diaNascimento = dataNascimento.getDate();
      
      if (mesAtual < mesNascimento || (mesAtual === mesNascimento && diaAtual < diaNascimento)) {
        idade--;
      }
      
      setIsMinoridade(idade < 18);
    } else {
      setIsMinoridade(false);
    }
  }, [form.dataNascto]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const formatarData = (dataISO: string): string => {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const validar = () => {
    const novosErros: any = {};
    
    if (!form.nome.trim()) novosErros.nome = "Nome é obrigatório";
    if (!form.cpf.trim()) novosErros.cpf = "CPF é obrigatório";
    else if (!validarCPF(form.cpf)) novosErros.cpf = "CPF inválido";
    if (!form.email.trim()) novosErros.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) novosErros.email = "Email inválido";
    if (!form.curso) novosErros.curso = "Selecione um curso";
    if (!form.sexo) novosErros.sexo = "Selecione o sexo";
    if (!form.dataNascto) novosErros.dataNascto = "Data de nascimento é obrigatória";
    if (!form.telefone.trim()) novosErros.telefone = "Telefone celular é obrigatório";
    if (!form.escolaridade) novosErros.escolaridade = "Escolaridade é obrigatória";
    if (!form.trabalhando) novosErros.trabalhando = "Informe se está trabalhando";
    if (!form.bairro.trim()) novosErros.bairro = "Bairro é obrigatório";
    if (!form.ehCuidador) novosErros.ehCuidador = "Informe se é cuidador de alguém";
    if (!form.ehPCD) novosErros.ehPCD = "Informe se é PCD";
    if (form.ehPCD === "S" && !form.tipoPCD.trim()) novosErros.tipoPCD = "Informe o tipo de PCD";
    if (form.ehPCD === "S" && !form.necessitaElevador) novosErros.necessitaElevador = "Informe se necessita de elevador";
    if (!form.comoSoube) novosErros.comoSoube = "Informe como soube do curso";
    if (!form.autorizaWhatsApp) novosErros.autorizaWhatsApp = "Informe se autoriza contato por WhatsApp";
    if (form.autorizaWhatsApp === "N") novosErros.autorizaWhatsApp = "É necessário autorizar o contato via WhatsApp para prosseguir com a inscrição";
    if (form.curso.toLowerCase().includes("canva") && !form.levaNotebook) {
      novosErros.levaNotebook = "Informe se irá levar notebook";
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    
    setLoading(true);
  
    const cursoSelecionado = cursos.find((c: any) => c.nome === form.curso);
    if (!cursoSelecionado) {
      toast.error("Curso selecionado não encontrado", { position: "top-center" });
      setLoading(false);
      return;
    }
    
    if (cursoSelecionado.vagasPreenchidas >= cursoSelecionado.vagasTotais) {
      toast.error("As vagas para este curso já foram preenchidas", { position: "top-center" });
      setLoading(false);
      return;
    }
  
    // Formatação correta da data para DD/MM/AAAA
    const dataNasctoFormatada = formatarData(form.dataNascto);
    
    const agora = new Date();
    const dataFormatada = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()}`;
    
    const dadosParaEnviar = {
      nome: form.nome.trim(),
      cpf: form.cpf.replace(/[^\d]/g, ''),
      email: form.email.trim().toLowerCase(),
      sexo: form.sexo,
      telefone: form.telefone.replace(/[^\d]/g, ''),
      dataNascto: dataNasctoFormatada, // Usar o formato DD/MM/AAAA
      curso: cursoSelecionado.id, // Enviar o ID original sem conversão
      dataInscricao: dataFormatada, // Já está no formato DD/MM/AAAA
      escolaridade: form.escolaridade,
      trabalhando: form.trabalhando,
      bairro: form.bairro.trim(),
      ehCuidador: form.ehCuidador,
      ehPCD: form.ehPCD,
      tipoPCD: form.ehPCD === "S" ? form.tipoPCD.trim() : "",
      necessitaElevador: form.ehPCD === "S" ? form.necessitaElevador : "N",
      comoSoube: form.comoSoube,
      autorizaWhatsApp: form.autorizaWhatsApp,
      levaNotebook: form.curso.toLowerCase().includes("canva") ? form.levaNotebook : "N"
    };
  
    console.log("Dados a enviar:", dadosParaEnviar);
  
    try {
      const res = await fetch(`${API_URL}/inscricao`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(dadosParaEnviar),
      });
  
      let responseBody;
      try {
        responseBody = await res.text();
        console.log("Resposta:", responseBody);
      } catch (e) {
        console.error("Erro ao ler resposta:", e);
      }
  
      if (res.status === 409) {
        toast.error("CPF já cadastrado para este curso", { position: "top-center" });
        setLoading(false);
        return;
      }
  
      if (res.status === 400) {
        let errorMessage = "Dados inválidos. Verifique o formulário e tente novamente.";
        
        if (responseBody) {
          try {
            const jsonResponse = JSON.parse(responseBody);
            if (jsonResponse.message) {
              errorMessage = jsonResponse.message;
            } else if (jsonResponse.error) {
              errorMessage = jsonResponse.error;
            }
          } catch (e) {
            if (responseBody.length < 100) {
              errorMessage = responseBody;
            }
          }
        }
        
        toast.error(errorMessage, { position: "top-center" });
        setLoading(false);
        return;
      }
  
      if (!res.ok) throw new Error(`Erro ao salvar inscrição: ${res.status}`);
  
      localStorage.setItem("ultimaInscricaoData", agora.toISOString().slice(0, 10));
      localStorage.setItem("ultimaInscricaoHora", agora.toTimeString().slice(0, 5));
      
      toast.success("Inscrição enviada com sucesso!", { position: "top-center" });
      setTimeout(() => navigate("/confirmacao"), 2000);
    } catch (err) {
      console.error("Erro ao enviar inscrição:", err);
      toast.error("Erro ao enviar inscrição. Tente novamente.", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Formulário de Inscrição</h1>
      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium mb-1">Nome completo</label>
            <input 
              type="text" 
              id="nome"
              name="nome" 
              placeholder="Nome completo" 
              value={form.nome} 
              onChange={handleChange} 
              className="w-full p-2 border rounded" 
            />
            {erros.nome && <p className="text-red-600 text-sm mt-1">{erros.nome}</p>}
          </div>
          
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium mb-1">CPF</label>
            <input 
              type="text" 
              id="cpf"
              name="cpf" 
              placeholder="CPF (somente números)" 
              value={form.cpf} 
              onChange={handleChange} 
              className="w-full p-2 border rounded" 
            />
            {erros.cpf && <p className="text-red-600 text-sm mt-1">{erros.cpf}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              id="email"
              name="email" 
              placeholder="Seu melhor email" 
              value={form.email} 
              onChange={handleChange} 
              className="w-full p-2 border rounded" 
            />
            {erros.email && <p className="text-red-600 text-sm mt-1">{erros.email}</p>}
          </div>
          
          <div>
            <label htmlFor="telefone" className="block text-sm font-medium mb-1">Telefone celular</label>
            <input 
              type="tel" 
              id="telefone"
              name="telefone" 
              placeholder="(DDD) Número" 
              value={form.telefone} 
              onChange={handleChange} 
              className="w-full p-2 border rounded" 
            />
            {erros.telefone && <p className="text-red-600 text-sm mt-1">{erros.telefone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dataNascto" className="block text-sm font-medium mb-1">Data de nascimento</label>
            <input 
              type="date" 
              id="dataNascto"
              name="dataNascto" 
              value={form.dataNascto} 
              onChange={handleChange} 
              className="w-full p-2 border rounded" 
            />
            {erros.dataNascto && <p className="text-red-600 text-sm mt-1">{erros.dataNascto}</p>}
          </div>
          
          <div>
            <label htmlFor="sexo" className="block text-sm font-medium mb-1">Sexo</label>
            <select 
              id="sexo"
              name="sexo" 
              value={form.sexo} 
              onChange={handleChange} 
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione o sexo</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
              <option value="O">Outro</option>
            </select>
            {erros.sexo && <p className="text-red-600 text-sm mt-1">{erros.sexo}</p>}
          </div>
        </div>

        {isMinoridade && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
            <div className="flex items-start mb-2">
              <div className="text-yellow-600 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-yellow-800">Atenção: Termo de Consentimento para Menor de Idade</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Para menores de 18 anos, é necessário que um responsável legal assine o termo de consentimento.
                  Baixe o documento, preencha-o e traga assinado no primeiro dia de aula.
                </p>
              </div>
            </div>
            <a 
              href="/Autorizacao-para-participacao-de-menores-no-curso.pdf" 
              download="Autorizacao-para-participacao-de-menores-no-curso.pdf"
              className="mt-2 inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Baixar Termo de Consentimento
            </a>
          </div>
        )}

        <div>
          <label htmlFor="curso" className="block text-sm font-medium mb-1">Curso de interesse</label>
          <select 
            id="curso"
            name="curso" 
            value={form.curso} 
            onChange={handleChange} 
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione o curso</option>
            {cursos.map((curso: any, index) => (
              <option 
                key={index} 
                value={curso.nome}
                disabled={curso.vagasPreenchidas >= curso.vagasTotais}
              >
                {curso.nome} {curso.vagasPreenchidas >= curso.vagasTotais ? '(SEM VAGAS)' : ''}
              </option>
            ))}
          </select>
          {erros.curso && <p className="text-red-600 text-sm mt-1">{erros.curso}</p>}
        </div>

        {mostrarCampoNotebook && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="mb-2">
              <h3 className="font-bold text-blue-800">Informação importante para o curso de Canva</h3>
              <p className="text-sm text-blue-700 mt-1">
              </p>
            </div>
            <div>
              <label htmlFor="levaNotebook" className="block text-sm font-medium mb-1">Você irá levar seu próprio notebook?</label>
              <select 
                id="levaNotebook"
                name="levaNotebook" 
                value={form.levaNotebook} 
                onChange={handleChange} 
                className="w-full p-2 border rounded"
              >
                <option value="">Selecione uma opção</option>
                <option value="S">Sim, levarei meu notebook</option>
                <option value="N">Não, precisarei usar um computador do local</option>
              </select>
              {erros.levaNotebook && <p className="text-red-600 text-sm mt-1">{erros.levaNotebook}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bairro" className="block text-sm font-medium mb-1">Bairro</label>
            <input 
              type="text" 
              id="bairro"
              name="bairro" 
              placeholder="Seu bairro" 
              value={form.bairro} 
              onChange={handleChange} 
              className="w-full p-2 border rounded" 
            />
            {erros.bairro && <p className="text-red-600 text-sm mt-1">{erros.bairro}</p>}
          </div>
          
          <div>
            <label htmlFor="escolaridade" className="block text-sm font-medium mb-1">Escolaridade</label>
            <select 
              id="escolaridade"
              name="escolaridade" 
              value={form.escolaridade} 
              onChange={handleChange} 
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione sua escolaridade</option>
              <option value="Fundamental incompleto">Fundamental incompleto</option>
              <option value="Fundamental completo">Fundamental completo</option>
              <option value="Médio incompleto">Médio incompleto</option>
              <option value="Médio completo">Médio completo</option>
              <option value="Superior incompleto">Superior incompleto</option>
              <option value="Superior completo">Superior completo</option>
              <option value="Pós-graduação">Pós-graduação</option>
            </select>
            {erros.escolaridade && <p className="text-red-600 text-sm mt-1">{erros.escolaridade}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="trabalhando" className="block text-sm font-medium mb-1">Está trabalhando atualmente?</label>
            <select 
              id="trabalhando"
              name="trabalhando" 
              value={form.trabalhando} 
              onChange={handleChange} 
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione uma opção</option>
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </select>
            {erros.trabalhando && <p className="text-red-600 text-sm mt-1">{erros.trabalhando}</p>}
          </div>
          
          <div>
            <label htmlFor="ehCuidador" className="block text-sm font-medium mb-1">É cuidador de alguém?</label>
            <select 
              id="ehCuidador"
              name="ehCuidador" 
              value={form.ehCuidador} 
              onChange={handleChange} 
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione uma opção</option>
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </select>
            {erros.ehCuidador && <p className="text-red-600 text-sm mt-1">{erros.ehCuidador}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ehPCD" className="block text-sm font-medium mb-1">É uma pessoa com deficiência (PCD)?</label>
            <select 
              id="ehPCD"
              name="ehPCD" 
              value={form.ehPCD} 
              onChange={handleChange} 
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione uma opção</option>
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </select>
            {erros.ehPCD && <p className="text-red-600 text-sm mt-1">{erros.ehPCD}</p>}
          </div>

          <div>
            <label htmlFor="comoSoube" className="block text-sm font-medium mb-1">Como soube do curso?</label>
            <select 
              id="comoSoube"
              name="comoSoube" 
              value={form.comoSoube} 
              onChange={handleChange} 
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione uma opção</option>
              <option value="Redes Sociais">Redes Sociais</option>
              <option value="Indicação de amigo">Indicação de amigo</option>
              <option value="Site">Site</option>
              <option value="Panfleto">Panfleto</option>
              <option value="Jornal">Jornal</option>
              <option value="Outro">Outro</option>
            </select>
            {erros.comoSoube && <p className="text-red-600 text-sm mt-1">{erros.comoSoube}</p>}
          </div>
        </div>

        {mostrarCamposPCD && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="tipoPCD" className="block text-sm font-medium mb-1">Qual o tipo de deficiência?</label>
              <input 
                type="text" 
                id="tipoPCD"
                name="tipoPCD" 
                placeholder="Descreva sua deficiência" 
                value={form.tipoPCD} 
                onChange={handleChange} 
                className="w-full p-2 border rounded" 
              />
              {erros.tipoPCD && <p className="text-red-600 text-sm mt-1">{erros.tipoPCD}</p>}
            </div>
            
            <div>
              <label htmlFor="necessitaElevador" className="block text-sm font-medium mb-1">Necessita de elevador?</label>
              <select 
                id="necessitaElevador"
                name="necessitaElevador" 
                value={form.necessitaElevador} 
                onChange={handleChange} 
                className="w-full p-2 border rounded"
              >
                <option value="">Selecione uma opção</option>
                <option value="S">Sim</option>
                <option value="N">Não</option>
              </select>
              {erros.necessitaElevador && <p className="text-red-600 text-sm mt-1">{erros.necessitaElevador}</p>}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="autorizaWhatsApp" className="block text-sm font-medium mb-1">Autoriza contato via WhatsApp?</label>
          <div className="bg-yellow-50 p-3 rounded mb-2 text-sm">
            <p className="text-yellow-800">Por favor, note que é necessário autorizar contato via WhatsApp para facilitar a comunicação durante o curso.</p>
          </div>
          <select 
            id="autorizaWhatsApp"
            name="autorizaWhatsApp" 
            value={form.autorizaWhatsApp} 
            onChange={handleChange} 
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione uma opção</option>
            <option value="S">Sim</option>
            <option value="N">Não</option>
          </select>
          {erros.autorizaWhatsApp && <p className="text-red-600 text-sm mt-1">{erros.autorizaWhatsApp}</p>}
        </div>

        <button 
          type="submit" 
          className={`w-full ${loading ? 'bg-gray-400' : 'bg-blue-600'} text-white py-3 rounded font-medium hover:bg-blue-700 transition-colors mt-6`}
          disabled={loading}
        >
          {loading ? "Processando..." : "Confirmar Inscrição"}
        </button>
      </form>
      <ToastContainer autoClose={3000} hideProgressBar newestOnTop theme="colored" />
    </div>
  );
}