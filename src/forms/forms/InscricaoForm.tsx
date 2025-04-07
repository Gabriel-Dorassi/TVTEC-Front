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
    // Novos campos
    escolaridade: "",
    trabalhando: "",
    bairro: "",
    ehCuidador: "",
    ehPCD: "",
    tipoPCD: "",
    necessitaElevador: "",
    comoSoube: "",
    autorizaWhatsApp: ""
  });

  const [cursos, setCursos] = useState<any[]>([]);
  const [erros, setErros] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [mostrarCamposPCD, setMostrarCamposPCD] = useState(false);

  useEffect(() => {
    fetch(CURSO_API)
      .then((res) => res.json())
      .then((data) => {
        console.log("Cursos carregados:", data);
        setCursos(data);
      })
      .catch(() => toast.error("Erro ao carregar cursos", { position: "top-center" }));
  }, []);

  useEffect(() => {
    if (cursoPreSelecionado) {
      setForm((prev) => ({ ...prev, curso: cursoPreSelecionado }));
    }
  }, [cursoPreSelecionado]);

  useEffect(() => {
    // Mostrar campos de PCD apenas quando ehPCD for "S"
    setMostrarCamposPCD(form.ehPCD === "S");
  }, [form.ehPCD]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const formatarData = (dataISO: string): string => {
    // Converter formato yyyy-MM-dd para dd/MM/yyyy
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const validar = () => {
    const novosErros: any = {};
    
    // Validações dos campos originais
    if (!form.nome.trim()) novosErros.nome = "Nome é obrigatório";
    if (!form.cpf.trim()) novosErros.cpf = "CPF é obrigatório";
    else if (!validarCPF(form.cpf)) novosErros.cpf = "CPF inválido";
    if (!form.email.trim()) novosErros.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) novosErros.email = "Email inválido";
    if (!form.curso) novosErros.curso = "Selecione um curso";
    if (!form.sexo) novosErros.sexo = "Selecione o sexo";
    if (!form.dataNascto) novosErros.dataNascto = "Data de nascimento é obrigatória";
    if (!form.telefone.trim()) novosErros.telefone = "Telefone celular é obrigatório";
    
    // Validações dos novos campos
    if (!form.escolaridade) novosErros.escolaridade = "Escolaridade é obrigatória";
    if (!form.trabalhando) novosErros.trabalhando = "Informe se está trabalhando";
    if (!form.bairro.trim()) novosErros.bairro = "Bairro é obrigatório";
    if (!form.ehCuidador) novosErros.ehCuidador = "Informe se é cuidador de alguém";
    if (!form.ehPCD) novosErros.ehPCD = "Informe se é PCD";
    if (form.ehPCD === "S" && !form.tipoPCD.trim()) novosErros.tipoPCD = "Informe o tipo de PCD";
    if (form.ehPCD === "S" && !form.necessitaElevador) novosErros.necessitaElevador = "Informe se necessita de elevador";
    if (!form.comoSoube) novosErros.comoSoube = "Informe como soube do curso";
    if (!form.autorizaWhatsApp) novosErros.autorizaWhatsApp = "Informe se autoriza contato por WhatsApp";
    
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

    console.log("Vagas do curso:", cursoSelecionado.vagasPreenchidas, "/", cursoSelecionado.vagasTotais);
    
    if (cursoSelecionado.vagasPreenchidas >= cursoSelecionado.vagasTotais) {
      toast.error("As vagas para este curso já foram preenchidas", { position: "top-center" });
      setLoading(false);
      return;
    }

    // Preparar os dados para envio
    const dataNasctoFormatada = formatarData(form.dataNascto);
    const agora = new Date();
    const dataFormatada = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()}`; // DD/MM/YYYY

    // Verificar o curso selecionado e obter o ID correto
    console.log("Curso selecionado:", cursoSelecionado);
    
    // Preparar os dados para envio
    const dadosParaEnviar = {
      // Dados do aluno
      nome: form.nome,
      cpf: form.cpf.replace(/[^\d]/g, ''), // Remover caracteres não numéricos
      email: form.email,
      sexo: form.sexo,
      telefone: form.telefone.replace(/[^\d]/g, ''), // Remover caracteres não numéricos
      dataNascto: dataNasctoFormatada,
      
      // Dados do curso - Curso deve ser um número (uint) conforme erro do backend
      curso: parseInt(cursoSelecionado.id.toString()), // Enviar ID como número
      // Não enviar cursoId separadamente para evitar confusão
      
      // Data de inscrição
      dataInscricao: dataFormatada,
      
      // Novos campos
      escolaridade: form.escolaridade,
      trabalhando: form.trabalhando,
      bairro: form.bairro,
      ehCuidador: form.ehCuidador,
      ehPCD: form.ehPCD,
      tipoPCD: form.ehPCD === "S" ? form.tipoPCD : "",
      necessitaElevador: form.ehPCD === "S" ? form.necessitaElevador : "N",
      comoSoube: form.comoSoube,
      autorizaWhatsApp: form.autorizaWhatsApp
    };

    console.log("Dados para envio:", dadosParaEnviar);

    try {
      const res = await fetch(`${API_URL}/inscricao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaEnviar),
      });

      // Obter o corpo da resposta para melhor diagnóstico
      let responseBody;
      try {
        responseBody = await res.text();
        console.log("Resposta do servidor:", res.status, responseBody);
      } catch (e) {
        console.error("Não foi possível ler o corpo da resposta:", e);
      }

      if (res.status === 409) {
        toast.error("CPF já cadastrado para este curso", { position: "top-center" });
        setLoading(false);
        return;
      }

      if (res.status === 400) {
        let errorMessage = "Dados inválidos. Verifique o formulário e tente novamente.";
        
        // Tentar extrair mensagem de erro mais específica
        if (responseBody) {
          try {
            const jsonResponse = JSON.parse(responseBody);
            if (jsonResponse.message) {
              errorMessage = jsonResponse.message;
            } else if (jsonResponse.error) {
              errorMessage = jsonResponse.error;
            }
          } catch (e) {
            // Se não for JSON, usar o texto bruto se for curto o suficiente
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

      // Registrar o horário da inscrição
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
        {/* Campos originais */}
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

        {/* Campos condicionais para PCD */}
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