import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API URLs
const API_BASE = "https://cursos-tv.onrender.com";

// Função para obter um token válido do servidor
async function obterToken() {
  try {
    // Credenciais conforme variáveis de ambiente fornecidas
    const credenciais = {
      username: "admin",
      password: "tvtec123"
    };
    
    // Endpoint de login
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(credenciais)
    });
    
    if (!response.ok) {
      throw new Error(`Erro no login: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // O token geralmente vem na resposta como data.token ou data.access_token
    console.log("Token obtido:", data.token || data.access_token);
    
    // Retorna o token da resposta
    return data.token || data.access_token;
  } catch (error) {
    console.error("Falha ao obter token:", error);
    throw error;
  }
}

// TypeScript interfaces
interface AuthStatus {
  status?: number;
  ok?: boolean;
  statusText?: string;
  data?: any;
  parseError?: string;
  error?: boolean;
  message?: string;
  protectedEndpoint?: ProtectedEndpointStatus;
  decodedToken?: DecodedToken | null;
}

interface ProtectedEndpointStatus {
  endpoint?: string;
  status?: number;
  ok?: boolean;
  statusText?: string;
  dataPreview?: string;
  parseError?: string;
  error?: boolean;
  message?: string;
}

interface DecodedToken {
  header: any;
  payload: any;
  signature: string;
}

export default function TestAuthComponent() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenDisplay, setTokenDisplay] = useState('');

  // Load token on initial render
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      updateTokenDisplay(savedToken);
    }
  }, []);

  // Helper to update the token display
  const updateTokenDisplay = (tokenValue: string) => {
    setTokenDisplay(tokenValue.length > 20 
      ? `${tokenValue.substring(0, 10)}...${tokenValue.substring(tokenValue.length - 10)}`
      : tokenValue);
  };

  // Decode JWT token without verification
  const decodeToken = (tokenValue: string): DecodedToken | null => {
    try {
      const parts = tokenValue.split('.');
      if (parts.length !== 3) {
        toast.warning('Token não está no formato JWT válido (header.payload.signature)');
        return null;
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      const signature = parts[2];

      return { header, payload, signature };
    } catch (error) {
      toast.error('Erro ao decodificar o token');
      console.error('Decode error:', error);
      return null;
    }
  };

  // Update token in localStorage
  const updateToken = () => {
    if (token.trim() === '') {
      toast.error('O token não pode estar vazio');
      return;
    }
    
    localStorage.setItem('token', token);
    localStorage.setItem('auth', 'true');
    toast.success('Token atualizado no localStorage');
    
    // Decode and display token info
    const decoded = decodeToken(token);
    if (decoded) {
      setAuthStatus(prev => ({ ...prev, decodedToken: decoded }));
      
      // Save username and role if available
      if (decoded.payload.username) {
        localStorage.setItem('username', decoded.payload.username);
      }
      if (decoded.payload.role) {
        localStorage.setItem('role', decoded.payload.role);
      }
      
      // Check expiration
      if (decoded.payload.exp) {
        const expDate = new Date(decoded.payload.exp * 1000);
        const now = new Date();
        if (expDate < now) {
          toast.warning(`Token expirado em ${expDate.toLocaleString()}`);
        } else {
          toast.info(`Token válido até ${expDate.toLocaleString()}`);
        }
      }
    }
    
    updateTokenDisplay(token);
  };

  // Clear authentication data
  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setToken('');
    setTokenDisplay('');
    setAuthStatus(null);
    toast.info('Dados de autenticação removidos');
  };

  // Test current token validity
  const testToken = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      toast.error('Não há token armazenado');
      return;
    }
    
    setLoading(true);
    try {
      // Test with validation endpoint
      const response = await fetch(`${API_BASE}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      const result: AuthStatus = {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        decodedToken: decodeToken(currentToken)
      };
      
      if (response.ok) {
        try {
          const data = await response.json();
          result.data = data;
          toast.success('Token válido!');
        } catch (e) {
          result.parseError = 'Erro ao analisar resposta JSON';
        }
      } else {
        toast.error(`Erro de autenticação: ${response.status} ${response.statusText}`);
      }
      
      setAuthStatus(result);
    } catch (error) {
      console.error('Erro ao testar token:', error);
      setAuthStatus({
        error: true,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        decodedToken: decodeToken(currentToken)
      });
      toast.error('Erro ao testar token');
    } finally {
      setLoading(false);
    }
  };

  // Test a protected endpoint
  const testProtectedEndpoint = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      toast.error('Não há token armazenado');
      return;
    }
    
    setLoading(true);
    try {
      // Test with a protected endpoint
      const response = await fetch(`${API_BASE}/admin/aluno`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      const result: ProtectedEndpointStatus = {
        endpoint: '/admin/aluno',
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      };
      
      if (response.ok) {
        try {
          const data = await response.json();
          result.dataPreview = Array.isArray(data) 
            ? `Array com ${data.length} itens` 
            : 'Objeto JSON';
          toast.success('Acesso ao endpoint protegido bem-sucedido!');
        } catch (e) {
          result.parseError = 'Erro ao analisar resposta JSON';
        }
      } else {
        toast.error(`Erro ao acessar endpoint protegido: ${response.status} ${response.statusText}`);
      }
      
      setAuthStatus(prev => ({ ...prev, protectedEndpoint: result }));
    } catch (error) {
      console.error('Erro ao testar endpoint protegido:', error);
      setAuthStatus(prev => ({ 
        ...prev, 
        protectedEndpoint: {
          error: true,
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }));
      toast.error('Erro ao testar endpoint protegido');
    } finally {
      setLoading(false);
    }
  };

  // Create a new simulated token (for testing only)
  const createSimulatedToken = () => {
    // Create a simple header
    const header = {
      alg: "HS256",
      typ: "JWT"
    };
    
    // Create a simple payload with expiration 24 hours from now
    const payload = {
      username: "test_user",
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      iat: Math.floor(Date.now() / 1000)
    };
    
    // Base64 encode the parts (not properly signed, just for demo)
    const headerBase64 = btoa(JSON.stringify(header));
    const payloadBase64 = btoa(JSON.stringify(payload));
    const signature = "DEMO_SIGNATURE_NOT_VALID"; // Not a real signature
    
    // Create the token
    const simulatedToken = `${headerBase64}.${payloadBase64}.${signature}`;
    setToken(simulatedToken);
    toast.info('Token simulado criado - clique em "Atualizar Token" para salvá-lo');
  };

  // Use the manual token provided in .env
  const useManualToken = () => {
    const manualToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNjk1ODQ5NjAwLCJpYXQiOjE2OTU3NjMyMDB9.2ixpTlj2EWYZ0Y7GqbOJxEO7D3xG-lHYPMFwDSfJZes";
    setToken(manualToken);
    toast.info('Token manual definido - clique em "Atualizar Token" para salvá-lo');
  };
  
  // Obter um novo token autêntico do servidor
  const obterNovoToken = async () => {
    setLoading(true);
    try {
      const novoToken = await obterToken();
      if (novoToken) {
        setToken(novoToken);
        updateTokenDisplay(novoToken);
        localStorage.setItem('token', novoToken);
        localStorage.setItem('auth', 'true');
        
        // Decode and display token info
        const decoded = decodeToken(novoToken);
        if (decoded) {
          setAuthStatus(prev => ({ ...prev, decodedToken: decoded }));
          
          // Save username and role if available
          if (decoded.payload.username) {
            localStorage.setItem('username', decoded.payload.username);
          }
          if (decoded.payload.role) {
            localStorage.setItem('role', decoded.payload.role);
          }
        }
        
        toast.success('Novo token obtido com sucesso!');
      }
    } catch (error) {
      toast.error(`Falha ao obter novo token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg my-8">
      <h1 className="text-2xl font-bold mb-6">Ferramenta de Teste de Autenticação</h1>
      
      {/* Token Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Gerenciamento de Token</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token JWT
          </label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 border rounded-md h-32 font-mono text-sm"
            placeholder="Cole seu token JWT aqui..."
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={updateToken}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            Atualizar Token
          </button>
          
          <button
            onClick={clearAuth}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            disabled={loading}
          >
            Limpar Autenticação
          </button>
          
          <button
            onClick={createSimulatedToken}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            disabled={loading}
          >
            Criar Token Simulado
          </button>
          
          <button
            onClick={useManualToken}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={loading}
          >
            Usar Token Manual
          </button>
          
          <button
            onClick={obterNovoToken}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            disabled={loading}
          >
            Fazer Login e Obter Token
          </button>
        </div>
      </div>
      
      {/* Tests Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Testes de Autenticação</h2>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={testToken}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              Testar Token
            </button>
            
            <button
              onClick={testProtectedEndpoint}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={loading}
            >
              Testar Endpoint Protegido
            </button>
          </div>
        </div>
        
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* Token Status */}
        {tokenDisplay && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Token atual: </span>
              {tokenDisplay}
            </p>
          </div>
        )}
        
        {/* Token Decoding (if available) */}
        {authStatus?.decodedToken && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-sm font-semibold text-green-800 mb-2">
              Token Decodificado:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-medium text-green-700">Usuário:</p>
                <p className="text-sm text-green-800">
                  {authStatus.decodedToken.payload.username || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-green-700">Perfil:</p>
                <p className="text-sm text-green-800">
                  {authStatus.decodedToken.payload.role || 'N/A'}
                </p>
              </div>
              {authStatus.decodedToken.payload.exp && (
                <div>
                  <p className="text-xs font-medium text-green-700">Expira em:</p>
                  <p className="text-sm text-green-800">
                    {new Date(authStatus.decodedToken.payload.exp * 1000).toLocaleString()}
                  </p>
                </div>
              )}
              {authStatus.decodedToken.payload.iat && (
                <div>
                  <p className="text-xs font-medium text-green-700">Emitido em:</p>
                  <p className="text-sm text-green-800">
                    {new Date(authStatus.decodedToken.payload.iat * 1000).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Test Results */}
        {authStatus && (
          <div className="mt-4 border rounded-md overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 font-medium">Resultados do Teste</div>
            <div className="p-4 bg-white">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded overflow-auto max-h-80">
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      {/* Help Information */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">Dicas para Solução de Problemas:</h3>
        <ul className="list-disc pl-5 text-blue-700 text-sm space-y-1">
          <li>Verifique se o token está no formato correto (3 partes separadas por pontos)</li>
          <li>Certifique-se de que o token não esteja expirado</li>
          <li>Confira se o servidor está configurado para aceitar o token</li>
          <li>Verifique se o token tem as claims (usuário/role) corretas</li>
          <li>Teste tanto a validação quanto um endpoint protegido real</li>
          <li>Verifique o algoritmo de assinatura (alg) no cabeçalho do token</li>
          <li>Certifique-se de que os horários do servidor estejam sincronizados (para validação de exp/iat)</li>
        </ul>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}