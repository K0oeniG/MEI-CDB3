import { useState } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';

export default function LandingPage() {
  const router = useRouter();
  const [view, setView] = useState('landing'); // landing, login, register, forgot, connect_wallet
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Ações de Autenticação Off-chain
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.error) return alert(data.error);
      
      alert(data.message);
      setView('login');
    } catch (err) { alert(err.message); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.error) return alert(data.error);

      setLoggedInUser(data.user.username);
      // Avança para a etapa de conectar a carteira conforme o fluxo do enunciado
      setView('connect_wallet');
    } catch (err) { alert(err.message); }
  };

  // Fluxo de conexão Web3 e associação à base de dados
  const handleConnectWallet = async () => {
    if (!window.ethereum) return alert('Por favor, instala a MetaMask!');
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Envia para o backend para associar a carteira à conta logada
      const res = await fetch('http://localhost:3001/api/auth/connect-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedInUser, walletAddress })
      });
      const data = await res.json();
      
      alert(`Sucesso! Carteira ${walletAddress.substring(0,6)}... associada à conta ${loggedInUser}`);
      
      // Salva a sessão local simples e redireciona para o painel principal
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) { alert(err.message); }
  };

  // Estilos inline futuristas Web3 Dark elegante
  const styles = {
    container: {
      background: 'radial-gradient(circle at center, #1a1a3a 0%, #0b0b12 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      color: '#fff',
      padding: '1rem'
    },
    card: {
      background: 'rgba(20, 20, 35, 0.85)',
      border: '1px solid #3a3a5c',
      borderRadius: '16px',
      padding: '2.5rem',
      width: '100%',
      maxWidth: '420px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(8px)',
      textAlign: 'center'
    },
    input: {
      width: '100%',
      padding: '0.8rem',
      margin: '0.6rem 0',
      background: '#0d0d1a',
      border: '1px solid #44446c',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '1rem'
    },
    btnPrimary: {
      width: '100%',
      padding: '0.8rem',
      background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
      border: 'none',
      borderRadius: '8px',
      color: '#fff',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginTop: '1rem',
      fontSize: '1rem',
      transition: 'transform 0.2s'
    },
    btnSocial: {
      width: '100%',
      padding: '0.6rem',
      background: '#1e1e38',
      border: '1px solid #3a3a5c',
      borderRadius: '8px',
      color: '#ccc',
      cursor: 'pointer',
      margin: '0.4rem 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    link: {
      color: '#a855f7',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontSize: '0.9rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* LOGO DA PLATAFORMA */}
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌌</div>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: '800', letterSpacing: '1px' }}>Block App</h2>

        {/* VISTA 1: LANDING INICIAL */}
        {view === 'landing' && (
          <div>
            <p style={{ color: '#aaa', marginBottom: '2rem' }}>A nova era do Lending descentralizado de Ether e colaterais NFT.</p>
            <button style={styles.btnPrimary} onClick={() => setView('login')}>Entrar na Plataforma</button>
            <button style={{ ...styles.btnPrimary, background: '#252542', marginTop: '0.5rem' }} onClick={() => setView('register')}>Criar Nova Conta</button>
          </div>
        )}

        {/* VISTA 2: LOGIN TRADICIONAL */}
        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <h3>Iniciar Sessão</h3>
            <input style={styles.input} type="text" placeholder="Nome de Utilizador" required onChange={e => setUsername(e.target.value)} />
            <input style={styles.input} type="password" placeholder="Palavra-passe" required onChange={e => setPassword(e.target.value)} />
            
            <span style={styles.link} onClick={() => setView('forgot')}>Esqueci-me da password</span>
            
            <button type="submit" style={styles.btnPrimary}>Login</button>
            
            <div style={{ margin: '1.5rem 0', color: '#666' }}>⎯⎯⎯ OU ⎯⎯⎯</div>
            <button type="button" style={styles.btnSocial} onClick={() => alert('Integração Google Fictícia')}>🌐 Entrar com Google</button>
            <button type="button" style={styles.btnSocial} onClick={() => alert('Integração Discord Fictícia')}>👾 Entrar com Discord</button>
            
            <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>Não tem conta? <span style={styles.link} onClick={() => setView('register')}>Registe-se</span></p>
          </form>
        )}

        {/* VISTA 3: CRIAR CONTA (REGISTO) */}
        {view === 'register' && (
          <form onSubmit={handleRegister}>
            <h3>Criar Conta Web3 off-chain</h3>
            <input style={styles.input} type="text" placeholder="Escolha um Utilizador" required onChange={e => setUsername(e.target.value)} />
            <input style={styles.input} type="password" placeholder="Defina a Palavra-passe" required onChange={e => setPassword(e.target.value)} />
            
            <button type="submit" style={styles.btnPrimary}>Registar e Avançar</button>
            <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>Já tem conta? <span style={styles.link} onClick={() => setView('login')}>Faça Login</span></p>
          </form>
        )}

        {/* VISTA 4: RECUPERAR PALAVRA-PASSE */}
        {view === 'forgot' && (
          <div>
            <h3>Recuperar Password</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Insira o seu utilizador para redefinir as credenciais.</p>
            <input style={styles.input} type="text" placeholder="Nome de Utilizador" />
            <button style={styles.btnPrimary} onClick={() => { alert('Pedido de redefinição enviado!'); setView('login'); }}>Enviar Link</button>
            <p style={{ marginTop: '1.5rem' }}><span style={styles.link} onClick={() => setView('login')}>Voltar ao Login</span></p>
          </div>
        )}

        {/* VISTA 5: CONECTAR CARTEIRA (APÓS LOGIN - REQUISITO DO FLUXO DO ENUNCIADO) */}
        {view === 'connect_wallet' && (
          <div>
            <h3 style={{ color: '#10b981' }}>✓ Autenticado como {loggedInUser}</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '2rem' }}>Para interagir com o protocolo DeFi, associe a sua MetaMask à sua conta Nexus.</p>
            <button style={{ ...styles.btnPrimary, background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' }} onClick={handleConnectWallet}>
              🦊 Conectar Carteira MetaMask
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #0b0b12;
        }
      `}</style>
    </div>
  );
}