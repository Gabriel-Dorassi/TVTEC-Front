export const authUtils = {
    // Armazenar o token JWT
    storeAuthToken: (token) => {
      if (!token) {
        console.error("Tentativa de armazenar token nulo ou vazio");
        return false;
      }
      
      // Armazenar o token no localStorage
      localStorage.setItem("token", token);
      
      // Verificar se o token foi armazenado corretamente
      const storedToken = localStorage.getItem("token");
      return storedToken === token;
    },
    
    // Obter o token JWT
    getAuthToken: () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("Token de autenticação não encontrado");
      }
      return token;
    },
    
    // Verificar se o usuário está autenticado
    isAuthenticated: () => {
      return localStorage.getItem("auth") === "true" && !!localStorage.getItem("token");
    },
    
    // Obter cabeçalhos de autenticação para requisições
    getAuthHeaders: () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("Gerando cabeçalhos sem token de autenticação");
        return {
          'Content-Type': 'application/json'
        };
      }
      
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    },
    
    // Testar autenticação com o servidor
    testAuth: async (apiUrl) => {
      const token = localStorage.getItem("token");
      if (!token) {
        return {
          success: false,
          message: "Token não encontrado no localStorage"
        };
      }
      
      try {
        const response = await fetch(`${apiUrl}/auth/validate`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            message: "Autenticação válida",
            data
          };
        } else {
          return {
            success: false,
            message: `Erro de autenticação: ${response.status} ${response.statusText}`,
            status: response.status
          };
        }
      } catch (error) {
        return {
          success: false,
          message: `Erro na requisição: ${error.message}`,
          error
        };
      }
    },
    
    // Limpar dados de autenticação
    clearAuth: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("auth");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
    }
  };
  
  // login.jsx - Modifique a função handleSubmit no seu componente Login
  // para usar o utilitário de autenticação
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
  
    try {
      setLoading(true);
  
      // Primeiro verificamos se estamos usando a senha local (para compatibilidade)
      if (senha === "tvtec123") {
        // Gerar um token local (simulado) para compatibilidade
        const localToken = btoa(`admin:${Date.now()}`);
        
        // Armazenar dados de autenticação com a nova utilidade
        const tokenStored = authUtils.storeAuthToken(localToken);
        localStorage.setItem("auth", "true");
        localStorage.setItem("username", "admin");
        localStorage.setItem("role", "admin");
        
        console.log("Autenticação local: Token armazenado:", tokenStored);
        
        toast.success("Login realizado com sucesso!");
        
        // Forçar um refresh da página
        window.location.href = "/admin";
        return;
      }
  
      // Se a senha local não funcionar, tenta a API
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: senha
        })
      });
  
      if (!response.ok) {
        throw new Error("Credenciais inválidas");
      }
  
      // Resposta bem-sucedida - parse do JSON
      const data = await response.json();
      
      // Verificar se o token existe na resposta
      if (!data.token) {
        throw new Error("Resposta do servidor não contém token");
      }
  
      // Armazenar o token usando o utilitário
      const tokenStored = authUtils.storeAuthToken(data.token);
      
      if (!tokenStored) {
        throw new Error("Falha ao armazenar token");
      }
      
      // Armazenar os outros dados de autenticação
      localStorage.setItem("auth", "true");
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);
  
      // Testar se o token é válido
      const testAuth = await authUtils.testAuth(API_URL);
      console.log("Teste de autenticação:", testAuth);
  
      if (!testAuth.success) {
        toast.warning("Autenticação incompleta: " + testAuth.message);
      } else {
        toast.success("Login realizado com sucesso!");
      }
      
      // Forçar um refresh da página para garantir que o estado global seja atualizado
      window.location.href = "/admin";
      
    } catch (error) {
      console.error("Erro no login:", error);
      setErro(error instanceof Error ? error.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };