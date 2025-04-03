import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Interface para tipagem do curso
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

// Interface para props do componente
interface FormularioCadastroProps {
  cursoId: number;
}

// Interface para dados do formulário
interface FormData {
  nome: string;
  cpf: string;
  email: string;
  sexo: string;
  dataNascto: string;
  telefone: string;
  escolaridade: string;
  trabalhando: string;
  bairro: string;
  ehCuidador: string;
  ehPCD: string;
  tipoPCD: string;
  necessitaElevador: string;
  comoSoube: string;
  autorizaWhatsApp: string;
}

// Lista de bairros (Exemplo - você pode substituir por sua própria lista)
const BAIRROS: string[] = [
  "Centro", "Jardim América", "Boa Vista", "São José", "Vila Nova",
  "Alto da Serra", "Parque Industrial", "Santa Mônica", "Liberdade",
  "Flamengo", "Bom Retiro", "Ipiranga", "Mooca", "Tijuca", "Botafogo"
];

export default function FormularioCadastro({ cursoId }: FormularioCadastroProps) {
  const API_URL = "https://cursos-tv.onrender.com";
  
  const [loading, setLoading] = useState<boolean>(false);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [filtroBairro, setFiltroBairro] = useState<string>("");
  const [bairrosFiltrados, setBairrosFiltrados] = useState<string[]>([]);
  const [bairroSelecionado, setBairroSelecionado] = useState<string>("");
  const [mostrarBairros, setMostrarBairros] = useState<boolean>(false);
  const [ehPCD, setEhPCD] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    nome: "",
    cpf: "",
    email: "",
    sexo: "",
    dataNascto: "",
    telefone: "",
    // Novos campos
    escolaridade: "",
    trabalhando: "",
    bairro: "",
    ehCuidador: "",
    ehPCD: "não",
    tipoPCD: "",
    necessitaElevador: "",
    comoSoube: "",
    autorizaWhatsApp: ""
  });

  // Carrega informações do curso
  useEffect(() => {
    if (!cursoId) return;

    const carregarCurso = async (): Promise<void> => {
      try {
        const response = await fetch(`${API_URL}/cursos/${cursoId}`);
        
        if (!response.ok) {
          throw new Error(`Erro na resposta: ${response.status}`);
        }
        
        const data = await response.json();
        setCurso(data);
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Erro ao carregar curso:", error);
        toast.error("Não foi possível carregar as informações do curso");
      }
    };

    carregarCurso();
  }, [cursoId]);

  // Filtra bairros com base no texto digitado
  useEffect(() => {
    if (filtroBairro.trim() === "") {
      setBairrosFiltrados([]);
      return;
    }
    
    const filtrados = BAIRROS.filter(bairro => 
      bairro.toLowerCase().includes(filtroBairro.toLowerCase())
    );
    
    setBairrosFiltrados(filtrados);
  }, [filtroBairro]);

  // Manipula mudanças nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    
    if (name === "ehPCD") {
      setEhPCD(value === "sim");
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manipula a seleção de um bairro da lista
  const handleBairroSelect = (bairro: string): void => {
    setFormData(prev => ({
      ...prev,
      bairro
    }));
    setBairroSelecionado(bairro);
    setFiltroBairro("");
    setMostrarBairros(false);
  };

  // Formatar data para envio ao backend - dd/mm/aaaa
  const formatarDataParaEnvio = (data: string): string => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Manipula o envio do formulário
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.nome || !formData.cpf || !formData.email) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    setLoading(true);
    
    try {
      // Formatar a data para o padrão esperado pelo backend (DD/MM/AAAA)
      const dataFormatada = formatarDataParaEnvio(formData.dataNascto);
      
      // Montar payload conforme esperado pelo controller.AlunoController.CadastrarAlunoEInscrever
      const payload = {
        nome: formData.nome,
        cpf: formData.cpf.replace(/\D/g, ""), // Remover formatação do CPF
        email: formData.email,
        curso: cursoId,
        sexo: formData.sexo,
        dataNascto: dataFormatada,
        telefone: formData.telefone.replace(/\D/g, ""), // Remover formatação do telefone
        escolaridade: formData.escolaridade,
        trabalhando: formData.trabalhando,
        bairro: formData.bairro,
        ehCuidador: formData.ehCuidador,
        ehPCD: formData.ehPCD,
        tipoPCD: formData.tipoPCD,
        necessitaElevador: formData.necessitaElevador,
        comoSoube: formData.comoSoube,
        autorizaWhatsApp: formData.autorizaWhatsApp
      };

      // Enviar diretamente para o endpoint de inscrição
      const response = await fetch(`${API_URL}/aluno/inscricao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Erro ao processar inscrição");
      }
      
      const responseData = await response.json();
      
      toast.success("Inscrição realizada com sucesso!");
      
      // Resetar formulário
      setFormData({
        nome: "",
        cpf: "",
        email: "",
        sexo: "",
        dataNascto: "",
        telefone: "",
        escolaridade: "",
        trabalhando: "",
        bairro: "",
        ehCuidador: "",
        ehPCD: "não",
        tipoPCD: "",
        necessitaElevador: "",
        comoSoube: "",
        autorizaWhatsApp: ""
      });
      
      setEhPCD(false);
      setBairroSelecionado("");
      
    } catch (err: unknown) {
      console.error("Erro no cadastro:", err);
      let errorMessage = "Erro desconhecido";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      toast.error(`Erro ao realizar inscrição: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Formatação de CPF para exibição
  const formatarCPF = (cpf: string): string => {
    const cpfLimpo = cpf.replace(/\D/g, "");
    
    if (cpfLimpo.length <= 3) return cpfLimpo;
    if (cpfLimpo.length <= 6) return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3)}`;
    if (cpfLimpo.length <= 9) return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(6)}`;
    
    return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(6, 9)}-${cpfLimpo.slice(9, 11)}`;
  };

  // Manipulador para o campo de CPF
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let cpf = e.target.value.replace(/\D/g, "");
    
    if (cpf.length > 11) {
      cpf = cpf.slice(0, 11);
    }
    
    setFormData(prev => ({
      ...prev,
      cpf: formatarCPF(cpf)
    }));
  };

  // Manipulador para o campo de telefone
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let telefone = e.target.value.replace(/\D/g, "");
    
    if (telefone.length > 11) {
      telefone = telefone.slice(0, 11);
    }
    
    if (telefone.length <= 2) {
      setFormData(prev => ({ ...prev, telefone }));
    } else if (telefone.length <= 6) {
      setFormData(prev => ({ 
        ...prev, 
        telefone: `(${telefone.slice(0, 2)}) ${telefone.slice(2)}` 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        telefone: `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}` 
      }));
    }
  };

  if (!curso && cursoId) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">
        {curso ? `Inscrição para o curso: ${curso.nome}` : "Formulário de Inscrição"}
      </h1>
      
      {curso && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800">Informações do Curso</h2>
          <p><strong>Professor:</strong> {curso.professor}</p>
          <p><strong>Data:</strong> {new Date(curso.data).toLocaleDateString('pt-BR')}</p>
          <p><strong>Carga Horária:</strong> {curso.cargaHoraria}h</p>
          <p><strong>Vagas disponíveis:</strong> {curso.vagasTotais - curso.vagasPreenchidas} de {curso.vagasTotais}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <fieldset className="border rounded-md p-4">
          <legend className="text-lg font-semibold px-2">Dados Pessoais</legend>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF *
              </label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento *
              </label>
              <input
                type="date"
                name="dataNascto"
                value={formData.dataNascto}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleTelefoneChange}
                placeholder="(00) 00000-0000"
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gênero *
              </label>
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Não Binário">Não Binário</option>
                <option value="Prefiro não informar">Prefiro não informar</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grau de Escolaridade *
              </label>
              <select
                name="escolaridade"
                value={formData.escolaridade}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione</option>
                <option value="Ensino Fundamental">Ensino Fundamental</option>
                <option value="Ensino Médio">Ensino Médio</option>
                <option value="Graduado">Graduado</option>
                <option value="Pós-Graduado">Pós-Graduado</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Você está trabalhando? *
              </label>
              <div className="flex gap-4 mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="trabalhando"
                    value="sim"
                    checked={formData.trabalhando === "sim"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Sim</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="trabalhando"
                    value="não"
                    checked={formData.trabalhando === "não"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Não</span>
                </label>
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro onde mora *
              </label>
              <input
                type="text"
                value={filtroBairro}
                onChange={(e) => {
                  setFiltroBairro(e.target.value);
                  setMostrarBairros(true);
                }}
                placeholder={bairroSelecionado || "Digite para buscar bairros"}
                className="w-full p-2 border border-gray-300 rounded-md"
                onFocus={() => setMostrarBairros(true)}
              />
              
              {mostrarBairros && bairrosFiltrados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {bairrosFiltrados.map((bairro) => (
                    <div
                      key={bairro}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleBairroSelect(bairro)}
                    >
                      {bairro}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </fieldset>
        
        {/* Informações Adicionais */}
        <fieldset className="border rounded-md p-4">
          <legend className="text-lg font-semibold px-2">Informações Adicionais</legend>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Você é cuidador de pessoas com deficiências físicas ou intelectuais, transtornos e síndromes? *
              </label>
              <div className="flex gap-4 mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="ehCuidador"
                    value="sim"
                    checked={formData.ehCuidador === "sim"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Sim</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="ehCuidador"
                    value="não"
                    checked={formData.ehCuidador === "não"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Não</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Você é uma pessoa com deficiência? *
              </label>
              <div className="flex gap-4 mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="ehPCD"
                    value="sim"
                    checked={formData.ehPCD === "sim"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Sim</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="ehPCD"
                    value="não"
                    checked={formData.ehPCD === "não"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Não</span>
                </label>
              </div>
            </div>
            
            {formData.ehPCD === "sim" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qual deficiência? *
                </label>
                <input
                  type="text"
                  name="tipoPCD"
                  value={formData.tipoPCD}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required={formData.ehPCD === "sim"}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Necessita de elevador? *
              </label>
              <div className="flex gap-4 mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="necessitaElevador"
                    value="sim"
                    checked={formData.necessitaElevador === "sim"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Sim</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="necessitaElevador"
                    value="não"
                    checked={formData.necessitaElevador === "não"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Não</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Como você soube do curso? *
              </label>
              <select
                name="comoSoube"
                value={formData.comoSoube}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione</option>
                <option value="Redes Sociais">Redes Sociais</option>
                <option value="Indicação">Indicação</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autorizo a inclusão do meu telefone no grupo de WhatsApp da turma *
                <span className="text-sm text-gray-500"> (Em acordo com a PLS n° 347, de 2016)</span>
              </label>
              <div className="flex gap-4 mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="autorizaWhatsApp"
                    value="autorizo"
                    checked={formData.autorizaWhatsApp === "autorizo"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Autorizo</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="autorizaWhatsApp"
                    value="não autorizo"
                    checked={formData.autorizaWhatsApp === "não autorizo"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Não autorizo</span>
                </label>
              </div>
            </div>
          </div>
        </fieldset>
        
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-3 rounded-md text-white font-medium ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                Processando...
              </div>
            ) : (
              "Realizar Inscrição"
            )}
          </button>
        </div>
      </form>
      
      <ToastContainer autoClose={3000} hideProgressBar theme="colored" />
    </div>
  );
}
