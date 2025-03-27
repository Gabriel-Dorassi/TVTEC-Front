import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Páginas
import Home from "./pages/Home";
import Confirmacao from "./pages/Confirmacao";
import Login from "./pages/Login";
import CadastroCurso from "./pages/CadastroCurso";
import CursosDisponiveis from "./pages/CursosDisponiveis";
import CursoDetalhes from "./pages/CursoDetalhes";
import InscricoesDetalhadas from "./pages/InscricoesDetalhadas";
import PaginaGerenciamento from "./pages/PaginaGerenciamento";

// Componentes
import Menu from "./components/Menu";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Menu />
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/confirmacao" element={<Confirmacao />} />
        <Route path="/cursos-disponiveis" element={<CursosDisponiveis />} />
        <Route path="/cursos/:id" element={<CursoDetalhes />} />
        
        {/* Rotas protegidas que requerem autenticação */}
        <Route
          path="/cadastrar-curso"
          element={
            <ProtectedRoute>
              <CadastroCurso />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/inscricoes"
          element={
            <ProtectedRoute>
              <InscricoesDetalhadas />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <PaginaGerenciamento />
            </ProtectedRoute>
          }
        />
        
        {/* Rota de fallback - redireciona para a página inicial */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Container de notificações global */}
      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
  );
}

export default App;