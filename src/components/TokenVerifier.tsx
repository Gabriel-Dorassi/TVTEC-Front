import { useState, useEffect } from 'react';

export default function TokenVerifier() {
  const [authInfo, setAuthInfo] = useState({
    auth: null as string | null,
    token: null as string | null,
    username: null as string | null,
    role: null as string | null,
  });

  useEffect(() => {
    // Função para atualizar as informações de autenticação do localStorage
    const updateAuthInfo = () => {
      const token = localStorage.getItem('token');
      
      setAuthInfo({
        auth: localStorage.getItem('auth'),
        token: token ? `${token.substring(0, 15)}...${token.substring(token.length - 15)}` : null,
        username: localStorage.getItem('username'),
        role: localStorage.getItem('role'),
      });
    };

    // Atualizar inicialmente
    updateAuthInfo();

    // Configurar um intervalo para verificar a cada segundo
    const interval = setInterval(updateAuthInfo, 1000);

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-blue-100 border border-blue-300 rounded-lg shadow-lg max-w-md z-50">
      <h3 className="text-lg font-bold mb-2">Informações de Autenticação</h3>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="font-medium pr-3">Auth:</td>
            <td>{authInfo.auth || 'Não definido'}</td>
          </tr>
          <tr>
            <td className="font-medium pr-3">Token:</td>
            <td className="break-all">{authInfo.token || 'Não definido'}</td>
          </tr>
          <tr>
            <td className="font-medium pr-3">Username:</td>
            <td>{authInfo.username || 'Não definido'}</td>
          </tr>
          <tr>
            <td className="font-medium pr-3">Função:</td>
            <td>{authInfo.role || 'Não definido'}</td>
          </tr>
        </tbody>
      </table>
      <button 
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
        onClick={() => {
          window.localStorage.clear();
          setAuthInfo({
            auth: null,
            token: null,
            username: null,
            role: null,
          });
        }}
      >
        Limpar Armazenamento
      </button>
    </div>
  );
}