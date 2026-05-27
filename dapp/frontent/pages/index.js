import { useState } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState('login'); 
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.error) return alert(data.error);
    alert("Conta criada! Agora faça login.");
    setView('login');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.error) return alert(data.error);

    setLoggedInUser(data.user.username);
    setView('connect_wallet');
  };

  const handleConnectWallet = async () => {
    if (!window.ethereum) return alert('Instale a MetaMask!');
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();

      const res = await fetch('http://localhost:3001/api/auth/connect-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedInUser, walletAddress })
      });
      const data = await res.json();
      
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) { alert(err.message); }
  };

  
  const styles = {
    container: {
      background: 'radial-gradient(circle at center, #1a1a3a 0%, #0b0b12 100%)',
      minHeight: '100vh',
      width: '100vw',        
      margin: 0,             
      padding: 0,           
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      color: '#fff'
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
    <>
      <style jsx global>{`
        html, body, #__next {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          height: 100%;
          background-color: #0b0b12 !important;
        }
      `}</style>

      <div style={styles.container}>
        <div style={styles.card}>
          
          <h2 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Blockchain</h2>

          {view === 'login' && (
            <form onSubmit={handleLogin}>
              <h3>Acesso Restrito</h3>
              <input style={styles.input} type="text" placeholder="Utilizador" required onChange={e => setUsername(e.target.value)} />
              <input style={styles.input} type="password" placeholder="Password" required onChange={e => setPassword(e.target.value)} />
              <button type="submit" style={styles.btnPrimary}>Entrar</button>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                Sem conta? <span style={styles.link} onClick={() => setView('register')}>Registe-se</span>
              </p>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister}>
              <h3>Registo Obrigatório</h3>
              <input style={styles.input} type="text" placeholder="Novo Utilizador" required onChange={e => setUsername(e.target.value)} />
              <input style={styles.input} type="password" placeholder="Nova Password" required onChange={e => setPassword(e.target.value)} />
              <button type="submit" style={styles.btnPrimary}>Criar Conta</button>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                Já tem conta? <span style={styles.link} onClick={() => setView('login')}>Voltar ao Login</span>
              </p>
            </form>
          )}

          {view === 'connect_wallet' && (
            <div>
              <h3 style={{ color: '#10b981' }}>Passo Final: Autenticação</h3>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Associe a sua carteira MetaMask para aceder ao Dashboard.
              </p>
              <button style={styles.btnPrimary} onClick={handleConnectWallet}>
                🦊 Ligar Carteira
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}