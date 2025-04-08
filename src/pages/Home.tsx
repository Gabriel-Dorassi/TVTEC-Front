import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InscricaoForm from "../forms/forms/InscricaoForm";

const BASE_URL = "https://cursos-tv.onrender.com";
const CURSO_URL = `${BASE_URL}/curso`;

export default function Home() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  const carregarCursos = async () => {
    setCarregando(true);
    try {
      const response = await fetch(CURSO_URL);
      if (!response.ok) {
        throw new Error(`API respondeu com status ${response.status}`);
      }
      const dados = await response.json();
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

  const verificarStatus = (data: string) => {
    if (!data) return "Data inválida";
    const hoje = new Date();
    const dataInicio = new Date(data);
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

  const handleInscricao = (curso: any) => {
    if (!curso.nome) {
      toast.error("Erro ao selecionar o curso. Tente novamente.");
      return;
    }
    
    const element = document.getElementById('formulario-inscricao');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      sessionStorage.setItem('cursoPreSelecionado', curso.nome);
      const event = new CustomEvent('cursoSelecionado', { detail: curso.nome });
      window.dispatchEvent(event);
      toast.success(`Curso "${curso.nome}" selecionado. Preencha o formulário abaixo.`, {
        autoClose: 2000,
        onClick: () => toast.dismiss()
      });
    } else {
      toast.error("Não foi possível localizar o formulário de inscrição. Tente novamente.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow-xl p-8 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row items-center relative z-10">
          <div className="md:w-2/3 mb-8 md:mb-0 md:pr-8">
            <h1 className="text-4xl font-bold mb-4 leading-tight">Bem-vindo à TVTEC Cursos</h1>
            <div className="w-20 h-1 bg-teal-400 mb-6"></div>
            <p className="text-lg mb-6 text-blue-100">
            A TVTEC Cursos oferece cursos práticos e diretos, capacitando os participantes em áreas essenciais como produção audiovisual, redes sociais e empreendedorismo digital.
            <p>Transformamos talentos e ideias em oportunidades reais, permitindo que os jundiaienses trilhem seus próprios caminhos profissionais.</p>            
            </p>
            <Link to="/cursos-disponiveis" className="inline-block px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition duration-300 shadow-md">
              Ver todos os cursos
            </Link>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <div className="bg-white p-5 rounded-full shadow-xl overflow-hidden flex items-center justify-center transform hover:scale-105 transition duration-300" style={{ width: '220px', height: '220px' }}>
              <img 
                src="/TVTEC-logo.png" 
                alt="TVTEC Cursos" 
                className="max-w-full max-h-full object-contain" 
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Cursos Disponíveis</h2>
          <Link
            to="/cursos-disponiveis"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver todos
          </Link>
        </div>

        {erro && <p className="text-red-600 text-center mb-4">{erro}</p>}
        {carregando && !cursos.length && <p className="text-center my-4">Carregando cursos...</p>}

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cursos.map((curso, index) => {
            const podeInscrever = vagasAbertas(curso);
            const percentualPreenchido = Math.min(100, ((curso.vagasPreenchidas ?? 0) / (curso.vagasTotais ?? 1)) * 100);
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg shadow-md bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="bg-blue-600 text-white p-4">
                  <h3 className="text-xl font-bold truncate">{curso.nome}</h3>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center mb-3 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">
                      {formatarData(curso.data)}
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-3 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm truncate">Prof. {curso.professor || "Não informado"}</span>
                  </div>
                  
                  <div className="flex items-center mb-4 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{curso.cargaHoraria}h</span>
                  </div>
                  
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Vagas preenchidas</span>
                      <span className="text-sm font-medium text-gray-700">
                        {curso.vagasPreenchidas ?? 0}/{curso.vagasTotais ?? 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          percentualPreenchido >= 100 ? 'bg-red-600' : 
                          percentualPreenchido >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${percentualPreenchido}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {podeInscrever ? (
                    <button
                      onClick={() => handleInscricao(curso)}
                      className="block w-full text-center py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-300 shadow-sm"
                    >
                      Inscrever-se
                    </button>
                  ) : (
                    <button
                      disabled
                      className="block w-full text-center py-2.5 rounded-lg font-medium text-white bg-gray-400 cursor-not-allowed"
                    >
                      Vagas Esgotadas
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!carregando && cursos.length === 0 && (
          <p className="text-center my-8 text-gray-600">
            Nenhum curso disponível no momento.
          </p>
        )}
      </section>

      <section id="formulario-inscricao" className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Formulário de Inscrição</h2>
          <div className="w-16 h-1 bg-blue-600 mt-2"></div>
          <p className="text-gray-600 mt-4">Preencha o formulário abaixo para se inscrever em um dos nossos cursos. Todos os campos são obrigatórios.</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <InscricaoForm />
        </div>
      </section>

      <section className="mb-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Sobre a TVTEC Cursos</h2>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-2/3 md:pr-8">
            <p className="text-lg text-gray-700 mb-4">
              A TVTEC Cursos é uma iniciativa da Prefeitura de Jundiaí que visa proporcionar 
              capacitação profissional gratuita para os cidadãos, com foco em tecnologia 
              e competências para o mercado de trabalho.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Nossos cursos são ministrados por profissionais experientes e têm como objetivo 
              preparar os alunos para os desafios do mercado de trabalho atual, 
              contribuindo para a empregabilidade e o desenvolvimento econômico da região.
            </p>
            <p className="text-lg text-gray-700">
              Todos os cursos são gratuitos e abertos à comunidade, sujeitos apenas à 
              disponibilidade de vagas.
            </p>
          </div>
          <div className="md:w-1/3 mt-6 md:mt-0">
            <img 
              src="/prefeitura-logo.jpeg" 
              alt="Prefeitura de Jundiaí" 
              className="mx-auto max-h-48" 
            />
          </div>
        </div>
      </section>

      <footer className="bg-blue-800 text-white rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Contato</h3>
            <p>Email: contato@tvteccursos.com.br</p>
            <p>Telefone: (11) 1234-5678</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Endereço</h3>
            <p>Rua XXXX, 123 - Jundiaí, SP</p>
            <p>CEP: 13000-000</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Horário</h3>
            <p>Segunda a Sexta: 09:00 às 18:00</p>
          </div>
        </div>
        <div className="mt-4 text-center text-sm">
          &copy; {new Date().getFullYear()} TVTEC Cursos - Todos os direitos reservados
        </div>
      </footer>
      
      <ToastContainer 
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}