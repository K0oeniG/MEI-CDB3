import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';

const DEX_ABI = [
  "function setDexSwapRate(uint256 _newRate) external",
  "function setGlobalParams(uint256 _cycle, uint256 _interest, uint256 _fee, uint256 _maxDuration) external",
  "function owner() external view returns (address)"
];

const DEX_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function AdminConsole() {
  const [rate, setRate] = useState('');
  const [cycle, setCycle] = useState('');
  const [interest, setInterest] = useState('');
  const [fee, setFee] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [adminAddress, setAdminAddress] = useState('');

  const getSigner = async () => {
    if (!window.ethereum) throw new Error("MetaMask não detetada!");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    return provider.getSigner();
  };

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, provider);
          const owner = await contract.owner();
          setAdminAddress(owner);
        }
      } catch (e) { console.error(e); }
    };
    fetchAdmin();
  }, []);

  const updateRate = async () => {
    try {
      const sig = await getSigner();
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, sig);
      const tx = await contract.setDexSwapRate(ethers.utils.parseEther(rate));
      await tx.wait();
      alert('Taxa de Câmbio atualizada com sucesso!');
    } catch (err) { alert(err.message); }
  };

  const updateParams = async () => {
    try {
      const sig = await getSigner();
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, sig);
      const tx = await contract.setGlobalParams(cycle, interest, ethers.utils.parseEther(fee), maxDuration);
      await tx.wait();
      alert('Parâmetros Globais de Empréstimo reconfigurados!');
    } catch (err) { alert(err.message); }
  };

  // Estilos Web3 Dark Elegante
  const styles = {
    container: {
      background: 'radial-gradient(circle at center, #1b1035 0%, #080711 100%)',
      minHeight: '100vh',
      width: '100vw',                  // Força a largura total da janela
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      color: '#fff',
      padding: '3rem 1.5rem',
      boxSizing: 'border-box'          // Garante que o padding não estoure o ecrã
    },
    wrapper: {
      maxWidth: '800px',
      margin: '0 auto',
      background: 'rgba(20, 18, 38, 0.8)',
      border: '1px solid #3c2a6b',
      borderRadius: '16px',
      padding: '2.5rem',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(10px)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #3c2a6b',
      paddingBottom: '1.5rem',
      marginBottom: '2rem'
    },
    section: {
      background: '#0d0c1d',
      border: '1px solid #291f4f',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
    },
    input: {
      width: '100%',
      maxWidth: '300px',
      padding: '0.75rem',
      margin: '0.5rem 0 1rem 0',
      background: '#070612',
      border: '1px solid #48348a',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '1rem'
    },
    btn: {
      padding: '0.75rem 1.5rem',
      background: 'linear-gradient(90deg, #8b5cf6 0%, #d946ef 100%)',
      border: 'none',
      borderRadius: '8px',
      color: '#fff',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'opacity 0.2s'
    },
    btnNav: {
      padding: '0.5rem 1rem',
      background: '#1f1a3a',
      border: '1px solid #5b41b8',
      borderRadius: '8px',
      color: '#fff',
      cursor: 'pointer',
      textDecoration: 'none',
      fontSize: '0.9rem'
    }
  };

  return (
    <>
      {/* O SEGREDO ESTÁ AQUI: Remove as margens default do navegador e fixa o fundo */}
      <style jsx global>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #080711 !important;
          width: 100% !important;
          height: 100% !important;
          overflow-x: hidden;
        }
      `}</style>

      <div style={styles.container}>
        <div style={styles.wrapper}>
          <div style={styles.header}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', letterSpacing: '0.5px' }}> Central  de Administração</h1>
              {adminAddress && <small style={{ color: '#8b5cf6' }}>Dono do Contrato: {adminAddress}</small>}
            </div>
            <Link href="/dashboard" style={styles.btnNav}>← Voltar ao App</Link>
          </div>

          {/* AJUSTE VALORIZAÇÃO TOKEN */}
          <div style={styles.section}>
            <h3 style={{ marginTop: 0, color: '#d946ef' }}>Ajustar Valorização do Token DEX</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Define o rácio de conversão de DEX para Wei (Custo por unidade de token).</p>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#ccc' }}>Novo Swap Rate (em Wei)</label>
            <input placeholder="Ex: 1000000000000000" style={styles.input} value={rate} onChange={e => setRate(e.target.value)} /><br/>
            <button style={styles.btn} onClick={updateRate}>Push Adjustment</button>
          </div>

          {/* PARÂMETROS GLOBAIS DE EMPRÉSTIMO */}
          <div style={styles.section}>
            <h3 style={{ marginTop: 0, color: '#8b5cf6' }}>Reconfigurar Variáveis Globais de Crédito</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Ajustes em tempo real para os ciclos de pagamento de taxas de juros do ecossistema.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Duração do Ciclo (Segundos)</label>
                <input placeholder="Ex: 60" style={styles.input} value={cycle} onChange={e => setCycle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Percentagem de Juros (Ex: 10 = 10%)</label>
                <input placeholder="Ex: 10" style={styles.input} value={interest} onChange={e => setInterest(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Taxa de Rescisão Precoce (Wei)</label>
                <input placeholder="Ex: 50000000000000" style={styles.input} value={fee} onChange={e => setFee(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Prazo Máximo Autorizado (Ciclos)</label>
                <input placeholder="Ex: 10" style={styles.input} value={maxDuration} onChange={e => setMaxDuration(e.target.value)} />
              </div>
            </div>
            <button style={{ ...styles.btn, marginTop: '1rem' }} onClick={updateParams}>Save Configuration</button>
          </div>
        </div>
      </div>
    </>
  );
}