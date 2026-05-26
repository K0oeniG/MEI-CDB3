import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

export default function Dashboard() {

  // ==============================================================
  // 1. TODOS OS ESTADOS (HOOKS) DECLARADOS NO INÍCIO
  // ==============================================================
  const [blockchainConfig, setBlockchainConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState(false);

  const [selectedMyNft, setSelectedMyNft] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [backendNfts, setBackendNfts] = useState([]); 
  const [selectedP2pLoan, setSelectedP2pLoan] = useState(null);

  const [isP2pMarketOpen, setIsP2pMarketOpen] = useState(false);
  const [isP2pInvestmentsOpen, setIsP2pInvestmentsOpen] = useState(false);
  const [isP2pMyLoansOpen, setIsP2pMyLoansOpen] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false); 
  const [isSalesOpen, setIsSalesOpen] = useState(false);    
  const [isAuctionsOpen, setIsAuctionsOpen] = useState(false);  

  const [selectedAuction, setSelectedAuction] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  const [myNfts, setMyNfts] = useState([]);
  const [nftFile, setNftFile] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('dex');
  const [marketListings, setMarketListings] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [p2pTab, setP2pTab] = useState('market'); 
  const [allP2pLoans, setAllP2pLoans] = useState([]);
  
  const [sessionUser, setSessionUser] = useState(null);
  const [dexBalance, setDexBalance] = useState('0');

  const [dexAmount, setDexAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [loanCollateral, setLoanCollateral] = useState('');
  const [loanDeadline, setLoanDeadline] = useState('');
  const [paymentLoanId, setPaymentLoanId] = useState('');
  const [paymentValue, setPaymentValue] = useState('');
  
  const [nftUri, setNftUri] = useState('');
  const [listTokenId, setListTokenId] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [isDexPayment, setIsDexPayment] = useState(false);
  const [buyTokenId, setBuyTokenId] = useState('');
  const [burnTokenId, setBurnTokenId] = useState('');
  
  const [auctionTokenId, setAuctionTokenId] = useState('');
  const [auctionMinPrice, setAuctionMinPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('');
  const [bidTokenId, setBidTokenId] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [endAuctionTokenId, setEndAuctionTokenId] = useState('');

  const [p2pLoanId, setP2pLoanId] = useState('');
  const [p2pEthRequest, setP2pEthRequest] = useState('');
  const [repayLoanId, setRepayLoanId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [liquidateLoanId, setLiquidateLoanId] = useState('');

  const [myDexLoans, setMyDexLoans] = useState([]);
  const [myP2pLoans, setMyP2pLoans] = useState([]);

  // ==============================================================
  // 2. TODOS OS USE EFFECTS
  // ==============================================================

  // A. OBTER CONFIGURAÇÃO WEB2.5
  useEffect(() => {
    const fetchBlockchainInfrastructure = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/blockchain/config');
        setBlockchainConfig(res.data);
        setLoadingConfig(false); 
      } catch (e) {
        console.error("Falha crítica ao obter ecossistema Web2.5 do backend:", e);
        setConfigError(true);
        setLoadingConfig(false);
      }
    };
    fetchBlockchainInfrastructure();
  }, []);

  useEffect(() => {
    const autoConnect = async () => {
      // Se já tivermos o signer, paramos para não repetir
      if (signer) return; 

      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        // Se a MetaMask já estiver ligada, "roubamos" o endereço sem pedir clique
        if (accounts.length > 0) {
          const prov = new ethers.providers.Web3Provider(window.ethereum);
          const sig = prov.getSigner();
          
          setSigner(sig);
          setAccount(accounts[0]);
          
          // Aqui chamamos as funções que atualizam os dados financeiros
          // NOTA: Certifica-te que estas funções estão definidas no Dashboard
          updateDexBalance(accounts[0], sig);
          fetchMyLoans(accounts[0], sig);
          fetchMarketData(accounts[0], sig);
        }
      }
    };
    
    // Só tentamos conectar se a config da blockchain já tiver carregado
    if (blockchainConfig) {
      autoConnect();
    }
  }, [blockchainConfig]); // Executa sempre que a config mudar
  

  // B. OBTER SESSÃO E DADOS DO BACKEND (NFTS)
  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(prov);
    }

    const cachedUser = localStorage.getItem('user');
    if (cachedUser) setSessionUser(JSON.parse(cachedUser));

    const fetchBackendData = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/nfts');
        setBackendNfts(res.data);
      } catch(e) { console.error("Erro a ler DB:", e); }
    };
    fetchBackendData();
  }, []);

  // C. RELÓGIO AO VIVO E HISTÓRICO DE EVENTOS PARA O LEILÃO
  useEffect(() => {
    // Proteção rigorosa: Não arranca se não houver config ou leilão selecionado!
    if (!selectedAuction || !blockchainConfig) return;

    const fetchHistory = async () => {
      try {
        const contract = new ethers.Contract(blockchainConfig.NFT_MARKET_ADDRESS, blockchainConfig.NFT_MARKET_ABI, signer);
        const filter = contract.filters.BidPlaced(selectedAuction.tokenId);
        const events = await contract.queryFilter(filter);
        
        const history = events.map(e => ({
          bidder: e.args.bidder,
          amount: e.args.amount
        })).reverse(); 
        
        setBidHistory(history);
      } catch (err) { console.error("Erro ao ler histórico:", err); }
    };
    fetchHistory();

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const end = selectedAuction.endTime.toNumber(); 
      
      if (now >= end) {
        setTimeLeft("🔴 Leilão Terminado");
        clearInterval(interval);
      } else {
        const diff = end - now;
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setTimeLeft(`⏳ ${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedAuction, signer, blockchainConfig]);


  // ==============================================================
  // 3. ECRÃS DE PARAGEM OBRIGATÓRIA (ERROS E LOADING)
  // ==============================================================

  if (configError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#450a0a', color: '#fff', textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
        <b style={{ fontSize: '1.5rem', color: '#fca5a5' }}>Falha Crítica de Conexão (Web2.5)</b>
        <p style={{ color: '#fecaca', maxWidth: '500px', lineHeight: '1.5' }}>
          O Frontend não conseguiu contactar o teu servidor Node.js no porto 3001 para obter os endereços da Blockchain.
        </p>
        <div style={{ background: '#270404', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', border: '1px solid #7f1d1d', marginTop: '1rem' }}>
          <b style={{ color: '#fff' }}>Checklist de Resolução:</b>
          <ol style={{ color: '#fca5a5', margin: '10px 0 0 0', paddingLeft: '20px' }}>
            <li>Abre um terminal na pasta do teu Backend e corre: <code>node server.js</code></li>
            <li>Garante que fizeste o deploy no Hardhat para gerar o ficheiro de configuração.</li>
            <li>Atualiza esta página.</li>
          </ol>
        </div>
      </div>
    );
  }

  if (loadingConfig || !blockchainConfig) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#fff' }}>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <b style={{ fontSize: '1.2rem', color: '#38bdf8' }}>Sincronização Web2.5 Operacional</b>
        <p style={{ color: '#94a3b8' }}>A carregar ABIs, Contratos e Endereços dinâmicos...</p>
      </div>
    );
  }

  // ==============================================================
  // 4. MAPEAR AS VARIÁVEIS (Seguro porque o loading já passou)
  // ==============================================================
  const DEX_ADDRESS = blockchainConfig.DEX_ADDRESS;
  const NFT_MARKET_ADDRESS = blockchainConfig.NFT_MARKET_ADDRESS;
  const DEX_ABI = blockchainConfig.DEX_ABI;
  const NFT_MARKET_ABI = blockchainConfig.NFT_MARKET_ABI;


  // ==============================================================
  // 5. AS FUNÇÕES DA APLICAÇÃO
  // ==============================================================
  const connectWallet = async () => {
    if (!provider) return alert('MetaMask não detetada!');
    await provider.send("eth_requestAccounts", []);
    const sig = provider.getSigner();
    setSigner(sig);
    const addr = await sig.getAddress();
    setAccount(addr);
    updateDexBalance(addr, sig);
    fetchMyLoans(addr, sig);
    fetchMarketData(addr, sig);
  };

  const updateDexBalance = async (addr, sig) => {
    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, sig || signer);
      const bal = await contract.balanceOf(addr); 
      setDexBalance(ethers.utils.formatEther(bal));
    } catch(e) { console.error("Erro no saldo:", e); }
  };

  const fetchMyLoans = async (userAddress, sig) => {
    const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, sig || signer);
    const foundDex = [];
    for (let i = 1; i <= 10; i++) { 
      try {
        const loan = await dexContract.loans(i);
        if (loan.borrower.toLowerCase() === userAddress.toLowerCase() && loan.amount.gt(0)) {
          foundDex.push({ id: i, ...loan });
        }
      } catch (e) {
        continue;
      }
    }
    setMyDexLoans(foundDex);
  };

  const handleBuyDex = async () => {
    
    if (!ethAmount || isNaN(ethAmount) || Number(ethAmount) <= 0) {
      return alert('⚠️ Por favor, insira uma quantidade válida de ETH para enviar.');
    }

    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.buyDex({ value: ethers.utils.parseEther(ethAmount) });
      await tx.wait();
      alert(' Tokens DEX adquiridos com sucesso!');
      updateDexBalance(account, signer);
      setEthAmount(''); 
    } catch (err) { 
    
      if (err.message.includes("user rejected")) return alert(" Transação cancelada pelo utilizador.");
      alert("Erro ao comprar DEX: Verifique se tem saldo ETH suficiente."); 
    }
  };


  const handleSellDex = async () => {
    if (!dexAmount || isNaN(dexAmount) || Number(dexAmount) <= 0) {
      return alert(' Por favor, insira a quantidade de DEX que deseja vender.');
    }

    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.sellDex(ethers.utils.parseEther(dexAmount));
      await tx.wait();
      alert(' Tokens DEX vendidos com sucesso!');
      updateDexBalance(account, signer);
      setDexAmount('');
    } catch (err) { 
      if (err.message.includes("user rejected")) return alert("Transação cancelada pelo utilizador.");
      if (err.message.includes("Tokens insuficientes")) return alert(" Não tem tokens DEX suficientes para esta venda.");
      alert(" Erro ao vender DEX."); 
    }
  };

  const handleTakeLoan = async () => {
    if (!loanCollateral || isNaN(loanCollateral) || Number(loanCollateral) <= 0) {
      return alert('Por favor, defina a quantidade de DEX para usar como garantia (Colateral).');
    }
    if (!loanDeadline || isNaN(loanDeadline) || Number(loanDeadline) <= 0) {
      return alert(' Por favor, defina a duração do empréstimo (em ciclos).');
    }

    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.loan(ethers.utils.parseEther(loanCollateral), loanDeadline);
      await tx.wait();
      alert(' Contrato de Empréstimo Iniciado com sucesso!');
      updateDexBalance(account, signer);
      fetchMyLoans(account, signer); 
    } catch (err) { 
      if (err.message.includes("user rejected")) return alert(" Transação cancelada.");
      if (err.message.includes("DEX insuficiente")) return alert(" Não tem saldo DEX suficiente para dar como garantia.");
      if (err.message.includes("Prazo invalido")) return alert(" O prazo inserido ultrapassa o limite máximo permitido.");
      alert(" Erro ao pedir o empréstimo."); 
    }
  };

const handleMakePayment = async () => {
    if (!paymentLoanId || isNaN(paymentLoanId)) {
      return alert(' Por favor, insira o ID do empréstimo que deseja pagar.');
    }
    if (!paymentValue || isNaN(paymentValue) || Number(paymentValue) <= 0) {
      return alert(' Por favor, insira o valor em ETH que vai pagar nesta prestação.');
    }

    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      
      // Validação Extra: O empréstimo existe?
      const loan = await contract.loans(paymentLoanId);
      if (loan.amount.eq(0)) return alert(" Este ID de empréstimo não existe ou já foi pago.");
      if (loan.borrower.toLowerCase() !== account.toLowerCase()) return alert(" Não é o dono deste empréstimo.");

      const tx = await contract.makePayment(paymentLoanId, { value: ethers.utils.parseEther(paymentValue) });
      await tx.wait();
      alert('Pagamento da prestação processado com sucesso!');
      fetchMyLoans(account, signer); 
    } catch (err) { 
      if (err.message.includes("Valor insuficiente")) return alert("O valor enviado não cobre a prestação atual.");
      if (err.message.includes("Prazo ultrapassado")) return alert("O prazo de pagamento já foi ultrapassado.");
      alert("Falha ao processar o pagamento."); 
    }
  };

  const handleMintNft = async () => {
    if (!nftFile) return alert(' Por favor, selecione uma imagem para o seu ativo digital.');
    if (!nftName || nftName.trim() === "") return alert(' O nome do Projeto/NFT é obrigatório.');
    if (!nftDescription || nftDescription.trim() === "") return alert(' A descrição do ativo é obrigatória.');
  
    try {
      const formData = new FormData();
      formData.append('nftImage', nftFile); 
      const uploadRes = await axios.post('http://localhost:3001/api/upload', formData);
      const finalUri = uploadRes.data.imageUrl; 
  
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      const tx = await contract.mintNFT(finalUri);
      await tx.wait();
    
      await axios.post('http://localhost:3001/api/nfts', {
        creator: account,
        tokenUri: finalUri, 
        name: nftName, 
        description: nftDescription
      });
  
      alert(`Ativo forjado com sucesso!\nA sua arte está guardada na galeria.`);
      setNftFile(null); 
      fetchMarketData(account, signer);
    } catch (err) { 
      if (err.message.includes("user rejected")) return alert(" Criação cancelada pelo utilizador.");
      alert(" Falha ao forjar o NFT. Verifique o servidor de imagens."); 
    }
  };

 const fetchMarketData = async (userAddress, sig) => {
    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, sig || signer);
      
      const tempVendas = [];
      const tempLeiloes = [];
      const tempP2p = [];
      const tempMeusNfts = [];
      const idsOcupados = new Set(); 

      // 1. Scan da Blockchain para encontrar o que está no Mercado
      for (let i = 1; i <= 50; i++) {
        try {
          // Verificar Vendas Diretas (CORRIGIDO: listing.active === true)
          const listing = await contract.listings(i);
          if (listing.price && listing.price.gt(0) && listing.active === true) {
            const uri = await contract.tokenURI(i);
            tempVendas.push({ tokenId: i, price: listing.price, isDexPayment: listing.isDexPayment, uri, seller: listing.seller });
            idsOcupados.add(i); 
          }

          // Verificar Leilões
          const auction = await contract.auctions(i);
          if (auction.active === true) {
            const uri = await contract.tokenURI(i);
            tempLeiloes.push({ tokenId: i, ...auction, uri });
            idsOcupados.add(i); 
          }

          // Verificar P2P
          const p2p = await contract.nftLoans(i);
          if (p2p.ethRequested && p2p.ethRequested.gt(0) && p2p.active === true) {
            let uri = "";
            try { uri = await contract.tokenURI(p2p.tokenId); } catch(err) {}
            tempP2p.push({ id: i, uri, ...p2p });
            idsOcupados.add(i);
          }
        } catch (e) { continue; }
      }

      // 2. Scan da Galeria (apenas os NFTs que NÃO estão ocupados em mercado/leilão)
      for (let i = 1; i <= 50; i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            if (!idsOcupados.has(i)) {
              const uri = await contract.tokenURI(i);
              tempMeusNfts.push({ tokenId: i, uri });
            }
          }
        } catch (e) { continue; }
      }
    
      // 3. Atualizar estados do React
      setMarketListings(tempVendas);
      setActiveAuctions(tempLeiloes);
      setAllP2pLoans(tempP2p);
      setMyNfts(tempMeusNfts); 
    } catch (err) { 
      console.error("Erro ao ler mercado:", err); 
    }
  };

  const handleBuyNft = async () => {
    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      const listing = await contract.listings(buyTokenId);
    
      if (listing.isDexPayment) {
        const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
        await (await dexContract.approve(NFT_MARKET_ADDRESS, listing.price)).wait();
        await (await contract.buyNFT(buyTokenId)).wait();
      } else {
        await (await contract.buyNFT(buyTokenId, { value: listing.price })).wait();
      }
      alert('NFT adquirido no mercado!');
      updateDexBalance(account, signer);
      fetchMarketData(account, signer);
    } catch (err) { alert(err.message); }
  };

  const handleBurnNft = async () => {
    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      await (await contract.burnNFT(burnTokenId)).wait();
      alert('NFT permanentemente destruído (burned).');
      fetchMarketData(account, signer);
    } catch (err) { alert(err.message); }
  };

  const handleEndAuction = async () => {
    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      await (await contract.endAuction(endAuctionTokenId)).wait();
      alert('Leilão finalizado e ativos distribuídos!');
      fetchMarketData(account, signer);
    } catch (err) { alert(err.message); }
  };

  const inputStyle = { display: 'block', marginBottom: '0.75rem', padding: '0.6rem', background: '#0a0a14', border: '1px solid #444', borderRadius: '6px', color: '#fff', width: '100%', boxSizing: 'border-box' };
  const cardStyle = { padding: '1.25rem', border: '1px solid #2a2a3a', borderRadius: '10px', background: '#141423', width: '100%', boxSizing: 'border-box' };
  const btnStyle = { padding: '0.6rem 1.2rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' };
  
  const calculateInstallment = (loan) => {
    return loan.amount.mul(loan.interest).div(100 * loan.deadline);
  };

  const calculateFinalPayment = (loan) => {
    return calculateInstallment(loan).add(loan.amount);
  };

  const handleTerminateLoan = async () => {
    if (!paymentLoanId || isNaN(paymentLoanId)) {
      return alert(' Por favor, insira o ID do empréstimo que deseja encerrar na caixa respetiva.');
    }

    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      
      
      const loan = await contract.loans(paymentLoanId);
      if (loan.amount.eq(0)) {
        return alert(" Este ID de empréstimo não existe ou já se encontra fechado.");
      }
      if (loan.borrower.toLowerCase() !== account.toLowerCase()) {
        return alert(" Não tem autorização para encerrar um empréstimo que não lhe pertence.");
      }

      const totalToPay = loan.amount.add(loan.termination); 
      const tx = await contract.terminateLoan(paymentLoanId, { value: totalToPay });
      await tx.wait();
    
      alert('Empréstimo encerrado antecipadamente com sucesso! O seu DEX foi devolvido.');
      fetchMyLoans(account, signer);
      updateDexBalance(account, signer);
    } catch (err) { 
      if (err.message.includes("user rejected")) return alert("Transação cancelada.");
      alert("Falha ao encerrar o empréstimo. Certifique-se de ter ETH suficiente para a multa e o capital."); 
    }
  };



const handleListNftForSale = async () => {
    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      
      console.log("A iniciar aprovação...");
      await (await contract.approve(NFT_MARKET_ADDRESS, listTokenId)).wait();
      
      console.log("A executar listNFT...");
      const tx = await contract.listNFT(listTokenId, ethers.utils.parseEther(listPrice), isDexPayment);
      const receipt = await tx.wait();
      
      console.log("Transação confirmada:", receipt);
      alert('✅ Listado com sucesso!');
      fetchMarketData(account, signer);
    } catch (err) {
      console.error("Erro detalhado:", err); 
      alert("Erro: " + err.message);
    }
  };
  // --- FUNÇÃO PARA INICIAR LEILÃO ---
  const handleStartAuction = async () => {
    if (!auctionTokenId || !auctionMinPrice || !auctionDuration) return alert('⚠️ Preencha todos os campos do leilão.');

    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      
      const owner = await contract.ownerOf(auctionTokenId);
      if (owner.toLowerCase() !== account.toLowerCase()) return alert("❌ Não é o dono deste NFT.");

      await (await contract.approve(NFT_MARKET_ADDRESS, auctionTokenId)).wait();
      await (await contract.startAuction(auctionTokenId, ethers.utils.parseEther(auctionMinPrice), auctionDuration)).wait();
      
      alert('Leilão iniciado!');
      fetchMarketData(account, signer);
    } catch (err) {
      alert(" Erro ao iniciar leilão: " + (err.reason || err.message));
    }
  };

 
  const handleRequestP2pLoan = async () => {
    const tId = document.getElementById('newLoanId')?.value;
    const eth = document.getElementById('newLoanEth')?.value;
    const time = document.getElementById('newLoanTime')?.value;

    if (!tId || !eth || !time) return alert(' Preencha todos os campos de financiamento (ID, ETH e Prazo).');

    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      
      const owner = await contract.ownerOf(tId);
      if (owner.toLowerCase() !== account.toLowerCase()) return alert("❌ NFT não lhe pertence.");

      await (await contract.approve(NFT_MARKET_ADDRESS, tId)).wait();
      await (await contract.requestNftLoan(tId, ethers.utils.parseEther(eth), time)).wait();
      
      alert(' Pedido de financiamento P2P submetido!');
      fetchMarketData(account, signer);
    } catch (err) { 
      alert("Erro no pedido P2P: " + (err.reason || err.message)); 
    }
  };


  const WalletMenu = ({ account, sessionUser, connectWallet, logout }) => {
  if (!sessionUser) {
    return (
      <button onClick={() => window.location.href = '/'} style={{ background: '#6366f1', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
        Login / Register
      </button>
    );
  }

  if (!account) {
    return (
      <button onClick={connectWallet} style={{ background: '#10b981', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
        Conectar Carteira
      </button>
    );
  }

  return (
    <div style={{ background: '#1e293b', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{sessionUser.username}</span>
      <div style={{ width: '1px', height: '20px', background: '#475569' }} />
      <button 
        onClick={logout}
        style={{ background: 'transparent', color: '#f87171', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
      >
        {`${account.substring(0,6)}...${account.slice(-4)} 🚪`}
      </button>
    </div>
  );
};

const logout = () => {
  localStorage.removeItem('user');
  setSessionUser(null);
  setAccount('');
  setSigner(null);
  window.location.reload(); // Recarrega para limpar todos os estados
};

  // ==============================================================
  // INTERFACE VISUAL
  // ==============================================================
  return (
    <div style={{ background: '#0b0a12', color: '#eee', minHeight: '100vh', width: '100vw', margin: 0, padding: '2rem 1rem', boxSizing: 'border-box' }}>
      
      <style jsx global>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #0b0a12 !important;
          width: 100% !important;
          height: 100% !important;
          overflow-x: hidden;
        }
      `}</style>
      
      <div style={{ maxWidth: '950px', margin: '0 auto', fontFamily: '"Segoe UI", sans-serif' }}>
        
        {/* CABEÇALHO */}
        
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '1rem' }}>
  <h1 style={{ margin: 0, fontWeight: '800', background: 'linear-gradient(90deg, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
    Blockchain 
  </h1>
  
  <WalletMenu 
    account={account} 
    sessionUser={sessionUser} 
    connectWallet={connectWallet} 
    logout={logout} 
  />
</div>

        {account && (
           <div style={{ background: 'linear-gradient(90deg, #1d1b3c, #0c0b1d)', padding: '1rem', borderRadius: '8px', margin: '1.5rem 0', border: '1px solid #4c3799', display: 'flex', justifyContent: 'space-between' }}>
             <span style={{ fontWeight: 'bold', color: '#c084fc' }}>📊 Carteira Sincronizada </span>
             <span>Saldo da Conta: <b>{dexBalance} DEX</b></span>
           </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: '0.5rem', margin: '2rem 0 1.5rem 0' }}>
          <button onClick={() => setActiveTab('dex')} style={{ padding: '0.75rem 1.25rem', border: 'none', background: activeTab === 'dex' ? '#2e2a52' : '#141323', color: '#fff', cursor: 'pointer', borderRadius: '6px' }}>💰 DEX Market & Loans</button>
          <button onClick={() => setActiveTab('nft-market')} style={{ padding: '0.75rem 1.25rem', border: 'none', background: activeTab === 'nft-market' ? '#2e2a52' : '#141323', color: '#fff', cursor: 'pointer', borderRadius: '6px' }}>🖼️ NFT Marketplace & Auctions</button>
          <button onClick={() => setActiveTab('p2p-pawn')} style={{ padding: '0.75rem 1.25rem', border: 'none', background: activeTab === 'p2p-pawn' ? '#2e2a52' : '#141323', color: '#fff', cursor: 'pointer', borderRadius: '6px' }}>🤝 Peer-to-Peer NFT Loans</button>
        </div>

        {/* ----------------- SECTOR 1: DEX & STANDARD LOANS ----------------- */}
        {activeTab === 'dex' && (
          <section>
            {/* CAIXA DOS EMPRÉSTIMOS DEX */}
            <div style={{ background: '#1e1b4b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #4338ca' }}>
              <h3 style={{ color: '#818cf8', marginTop: 0 }}>📋 Os Meus Empréstimos Ativos (DEX)</h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {myDexLoans.length > 0 ? myDexLoans.map(loan => {
                  const isLast = loan.paymentsMade.add(1).eq(loan.deadline);
                  const paymentValue = isLast ? calculateFinalPayment(loan) : calculateInstallment(loan);
                  
                  return (
                    <div key={loan.id} style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', border: '1px solid #334155', width: '260px' }}>
                      <b style={{ color: '#fff' }}>ID: {loan.id.toString()}</b>
                      <p style={{ margin: '5px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Capital: {ethers.utils.formatEther(loan.amount)} ETH</p>
                      <p style={{ margin: '5px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Prestações: {loan.paymentsMade.toString()} / {loan.deadline.toString()}</p>
                      <div style={{ marginTop: '10px', padding: '8px', background: '#1e293b', borderRadius: '4px' }}>
                        <small style={{ color: '#94a3b8' }}>{isLast ? "💰 VALOR FINAL:" : "📅 PRESTAÇÃO ATUAL:"}</small>
                        <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>{ethers.utils.formatEther(paymentValue)} ETH</div>
                      </div>
                    </div>
                  );
                }) : <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Não tens empréstimos Standard ativos neste momento.</p>}
              </div>
            </div>

            <h3 style={{ color: '#6366f1' }}>Mercado de Câmbio DEX</h3>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={cardStyle}>
                <h4> Comprar DEX </h4>
                <input style={inputStyle} placeholder="ETH a Enviar" onChange={e => setEthAmount(e.target.value)} />
                <button style={{ ...btnStyle, background: '#3b82f6' }} onClick={handleBuyDex}>Comprar</button>
              </div>
              <div style={cardStyle}>
                <h4>Vender DEX </h4>
                <input style={inputStyle} placeholder="DEX a Vender" onChange={e => setDexAmount(e.target.value)} />
                <button style={{ ...btnStyle, background: '#ef4444' }} onClick={handleSellDex}>Vender</button>
              </div>
            </div>
            
            <h3 style={{ color: '#6366f1' }}>Fundo de Crédito Standard</h3>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={cardStyle}>
                <h4>Requisitar Empréstimo (Imobilizar DEX)</h4>
                <input style={inputStyle} placeholder="Quantidade DEX Colateral" onChange={e => setLoanCollateral(e.target.value)} />
                <input style={inputStyle} placeholder="Duração em Ciclos (Ex: 3)" onChange={e => setLoanDeadline(e.target.value)} />
                <button style={{ ...btnStyle, background: '#10b981' }} onClick={handleTakeLoan}>Processar empréstimo</button>
              
              </div>

              <div style={cardStyle}>
                <h4>Pagar Prestação / Liquidar Antecipadamente</h4>
                <input style={inputStyle} placeholder="ID do Empréstimo" onChange={e => setPaymentLoanId(e.target.value)} />
                <input style={inputStyle} placeholder="ETH a Enviar para Amortizar" onChange={e => setPaymentValue(e.target.value)} />
                <button style={{ ...btnStyle, background: '#f59e0b' }} onClick={handleMakePayment}>Submeter Pagamento</button>
                  <button style={{ ...btnStyle, background: '#ef4444', marginLeft: '10px' }} onClick={handleTerminateLoan}>
                  Encerrar empréstimo
                </button>
              </div>
            </div>
          </section>
        )}

     {/* ----------------- SECTOR 2: NFT MARKETPLACE & AUCTIONS ----------------- */}
        {activeTab === 'nft-market' && (
          <section>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button style={{ ...btnStyle, background: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => fetchMarketData(account, signer)}>
                🔄 Atualizar Mercado
              </button>
            </div>

            {selectedAuction ? (
              <div style={{ background: '#1e1b4b', padding: '2rem', borderRadius: '12px', border: '1px solid #c026d3', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                
                <div style={{ flex: '1' }}>
                  <button 
                    style={{ ...btnStyle, background: '#4b5563', marginBottom: '1rem' }} 
                    onClick={() => setSelectedAuction(null)}
                  >
                    ⬅ Voltar às Galerias
                  </button>
                  <img src={selectedAuction.uri} alt="NFT Leilão" style={{ width: '100%', borderRadius: '10px', border: '2px solid #a855f7' }} />
                </div>

                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '3rem' }}>
                  
                  {(() => {
                    const meta = backendNfts.find(n => n.tokenUri === selectedAuction.uri) || {};
                    return (
                      <>
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '2rem' }}>
                          {meta.name || `Leilão do Token #${selectedAuction.tokenId}`}
                        </h2>
                        
                        <div style={{ background: '#121026', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #d946ef' }}>
                          <p style={{ margin: '0 0 5px 0', color: '#aaa', fontWeight: 'bold', fontSize: '0.9rem' }}>📝 Descrição do Projeto:</p>
                          <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.5', fontSize: '0.95rem' }}>
                            {meta.description || "Nenhuma descrição fornecida pelo criador."}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                  
                  <div style={{ background: '#000', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
                    <p style={{ color: '#aaa', margin: '0 0 5px 0' }}>Tempo Restante:</p>
                    <h3 style={{ margin: 0, color: timeLeft.includes('Terminado') ? '#ef4444' : '#fcd34d', fontSize: '1.8rem' }}>{timeLeft}</h3>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#2e1065', padding: '1rem', borderRadius: '8px' }}>
                    <div>
                      <p style={{ margin: 0, color: '#fbcfe8' }}>Preço Base</p>
                      <b style={{ color: '#fff' }}>{ethers.utils.formatEther(selectedAuction.minPrice)} ETH</b>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, color: '#10b981' }}>Maior Licitação Atual</p>
                      <b style={{ color: '#fff', fontSize: '1.2rem' }}>
                        {selectedAuction.highestBid.gt(0) ? ethers.utils.formatEther(selectedAuction.highestBid) : "0.0"} ETH
                      </b>
                      {selectedAuction.highestBidder && selectedAuction.highestBidder.toLowerCase() === account.toLowerCase() && (
                        <div style={{ background: '#059669', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', marginTop: '5px', fontWeight: 'bold' }}>
                          👑 És o líder atual!
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem', background: '#0a0a14', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
                    <h4 style={{ color: '#a855f7', margin: '0 0 10px 0', fontSize: '1rem' }}>📜 Histórico de Lances</h4>
                    {bidHistory.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '120px', overflowY: 'auto' }}>
                        {bidHistory.map((bid, idx) => (
                          <li key={idx} style={{ padding: '6px 0', borderBottom: '1px solid #222', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#aaa', fontFamily: 'monospace' }}>
                              👤 {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}
                            </span>
                            <b style={{ color: '#10b981' }}>{ethers.utils.formatEther(bid.amount)} ETH</b>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: '#555', margin: 0, fontSize: '0.9rem' }}>Ainda não há lances. Sê o primeiro!</p>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    {timeLeft.includes('Terminado') ? (
                      <button 
                        style={{ ...btnStyle, background: '#eab308', color: '#000', width: '100%', fontSize: '1.2rem', padding: '1rem' }} 
                        onClick={async () => {
                          try {
                            const c = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                            await (await c.endAuction(selectedAuction.tokenId)).wait();
                            alert('🏆 Leilão finalizado com sucesso! O NFT foi enviado para a tua galeria.');
                            setSelectedAuction(null);
                            fetchMarketData(account, signer);
                          } catch(e) { alert(e.message); }
                        }}
                      >
                        🏆 Finalizar Leilão e Reclamar NFT
                      </button>
                    ) : (
                      <>
                        <input id="auction-bid-amount" style={{ ...inputStyle, fontSize: '1.2rem', padding: '1rem' }} placeholder="Valor da tua licitação (ETH)" />
                        <button style={{ ...btnStyle, background: '#d946ef', width: '100%', fontSize: '1.2rem', padding: '1rem', marginTop: '10px' }} onClick={async () => {
                          if (account.toLowerCase() === selectedAuction.seller.toLowerCase()) {
                            return alert("⚠️ Ação Bloqueada: O dono do NFT não pode participar no próprio leilão!");
                          }
                          try {
                            const val = document.getElementById('auction-bid-amount').value;
                            const c = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                            await (await c.placeBid(selectedAuction.tokenId, { value: ethers.utils.parseEther(val) })).wait();
                            alert('🔥 Licitação registada com sucesso!');
                            fetchMarketData(account, signer);
                            setSelectedAuction(null);
                          } catch(e) { alert(e.message); }
                        }}>Fazer Licitação</button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <>
                <div style={{ marginBottom: '2.5rem', width: '100%' }}>
                  <div 
                    onClick={() => setIsGalleryOpen(!isGalleryOpen)} 
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}
                  >
                    <h3 style={{ color: '#c084fc', margin: 0, userSelect: 'none' }}>
                      {isGalleryOpen ? '▼' : '▶'} 🖼️ A Minha Coleção Pessoal (Galeria)
                    </h3>
                  </div>
                  
                  <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: 0, marginBottom: '1rem' }}>
                    Estes são os NFTs que possuis atualmente na tua carteira. Usa os IDs indicados para listar para venda, criar leilões ou pedir empréstimos P2P.
                  </p>
                  
                  {isGalleryOpen && (
                    selectedMyNft ? (
                      <div style={{ background: '#131129', padding: '2rem', borderRadius: '12px', border: '1px solid #3b2d6b', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1' }}>
                          <button style={{ ...btnStyle, background: '#3b2d6b', marginBottom: '1rem' }} onClick={() => setSelectedMyNft(null)}>⬅ Voltar à Galeria</button>
                          <img src={selectedMyNft.uri} alt="NFT" style={{ width: '100%', borderRadius: '10px', border: '2px solid #c084fc' }} />
                        </div>
                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '3rem' }}>
                          {(() => {
                            const meta = backendNfts.find(n => n.tokenUri === selectedMyNft.uri) || {};
                            return (
                              <>
                                <h2 style={{ margin: 0, color: '#fff', fontSize: '2rem' }}>{meta.name || `Asset #${selectedMyNft.tokenId}`}</h2>
                                <div style={{ background: '#0b0a12', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #c084fc' }}>
                                  <p style={{ margin: '0 0 5px 0', color: '#aaa', fontWeight: 'bold', fontSize: '0.9rem' }}>📝 Descrição do Ativo:</p>
                                  <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.5', fontSize: '0.95rem' }}>{meta.description || "Nenhuma descrição disponível."}</p>
                                </div>
                              </>
                            );
                          })()}
                          <div style={{ background: '#0b0a12', padding: '1rem', borderRadius: '8px', color: '#fff' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#aaa' }}>ID do Ativo na Blockchain: <b style={{ color: '#c084fc' }}>{selectedMyNft.tokenId}</b></p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: '#131129', padding: '1rem', borderRadius: '10px', border: '1px solid #3b2d6b' }}>
                        {myNfts.length > 0 ? myNfts.map(nft => (
                          <div 
                            key={nft.tokenId} 
                            onClick={() => setSelectedMyNft(nft)}
                            style={{ background: '#0b0a12', padding: '0.75rem', borderRadius: '8px', border: '1px solid #4c3799', width: '160px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <img src={nft.uri} alt={`NFT ${nft.tokenId}`} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px', backgroundColor: '#000' }} />
                            <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>ID do Token: <span style={{color: '#a855f7'}}>{nft.tokenId}</span></span>
                            <p style={{ color: '#c084fc', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '5px' }}>👉 Detalhes</p>
                          </div>
                        )) : (
                          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '10px' }}>Ainda não possuis nenhum NFT nesta carteira. Cria um no formulário abaixo!</p>
                        )}
                      </div>
                    )
                  )}
                </div>

                <div style={{ marginBottom: '2.5rem', width: '100%' }}>
                  <div 
                    onClick={() => setIsSalesOpen(!isSalesOpen)} 
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}
                  >
                    <h3 style={{ color: '#a855f7', margin: 0, userSelect: 'none' }}>
                      {isSalesOpen ? '▼' : '▶'} 🛒 Montra de Vendas Diretas
                    </h3>
                  </div>

                  {isSalesOpen && (
                    selectedSale ? (
                      <div style={{ background: '#1e1b4b', padding: '2rem', borderRadius: '12px', border: '1px solid #4338ca', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1' }}>
                          <button style={{ ...btnStyle, background: '#312e81', marginBottom: '1rem' }} onClick={() => setSelectedSale(null)}>⬅ Voltar à Montra</button>
                          <img src={selectedSale.uri} alt="NFT Venda" style={{ width: '100%', borderRadius: '10px', border: '2px solid #4338ca' }} />
                        </div>
                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '3rem' }}>
                          {(() => {
                            const meta = backendNfts.find(n => n.tokenUri === selectedSale.uri) || {};
                            return (
                              <>
                                <h2 style={{ margin: 0, color: '#fff', fontSize: '2rem' }}>{meta.name || `Item #${selectedSale.tokenId}`}</h2>
                                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
                                  <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontWeight: 'bold', fontSize: '0.9rem' }}>📝 Descrição do Item:</p>
                                  <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.5', fontSize: '0.95rem' }}>{meta.description || "Nenhuma descrição fornecida para esta listagem."}</p>
                                </div>
                              </>
                            );
                          })()}
                          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', color: '#fff' }}>
                            <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.85rem' }}>Vendedor:</p>
                            <p style={{ margin: 0, color: '#fff', fontFamily: 'monospace', fontSize: '0.95rem', overflowWrap: 'anywhere' }}>{selectedSale.seller}</p>
                            <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.5rem', margin: '15px 0 0 0' }}>
                              Preço: {ethers.utils.formatEther(selectedSale.price)} {selectedSale.isDexPayment ? 'DEX' : 'ETH'}
                            </p>
                          </div>
                          <button style={{ ...btnStyle, background: '#2563eb', width: '100%', fontSize: '1.2rem', padding: '1rem' }} onClick={async () => {
                            try {
                              const c = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                              if(selectedSale.isDexPayment){
                                 const dex = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
                                 await (await dex.approve(NFT_MARKET_ADDRESS, selectedSale.price)).wait();
                              }
                              await (await c.buyNFT(selectedSale.tokenId, { value: selectedSale.isDexPayment ? 0 : selectedSale.price })).wait();
                              alert('Comprado com sucesso!');
                              setSelectedSale(null);
                              fetchMarketData(account, signer);
                            } catch(e) { alert(e.message); }
                          }}>Adquirir Asset</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {marketListings.length > 0 ? marketListings.map(item => (
                          <div 
                            key={item.tokenId} 
                            onClick={() => setSelectedSale(item)}
                            style={{ background: '#1e1b4b', padding: '1rem', borderRadius: '8px', border: '1px solid #4338ca', width: '220px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <img src={item.uri} alt={`NFT ${item.tokenId}`} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px', backgroundColor: '#000' }} />
                            <b style={{ color: '#fff', display: 'block' }}>Token ID: {item.tokenId}</b>
                            <p style={{ color: '#10b981', fontWeight: 'bold', margin: '10px 0' }}>
                              {ethers.utils.formatEther(item.price)} {item.isDexPayment ? 'DEX' : 'ETH'}
                            </p>
                            <p style={{ color: '#a855f7', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '5px' }}>👉 Detalhes</p>
                          </div>
                        )) : <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Não há NFTs listados para venda direta.</p>}
                      </div>
                    )
                  )}
                </div>

                <div style={{ marginBottom: '2.5rem', width: '100%' }}>
                  <div onClick={() => setIsAuctionsOpen(!isAuctionsOpen)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#d946ef', margin: 0, userSelect: 'none' }}>{isAuctionsOpen ? '▼' : '▶'} 🔨 Leilões a Decorrer</h3>
                  </div>

                  {isAuctionsOpen && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {activeAuctions.length > 0 ? activeAuctions.map(auction => (
                        <div 
                          key={auction.tokenId} 
                          onClick={() => setSelectedAuction(auction)}
                          style={{ background: '#2e1065', padding: '1rem', borderRadius: '8px', border: '1px solid #c026d3', width: '220px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <img src={auction.uri} alt={`NFT ${auction.tokenId}`} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px', backgroundColor: '#000' }} />
                          <b style={{ color: '#fff', display: 'block' }}>Leilão ID: {auction.tokenId}</b>
                          <p style={{ color: '#fbcfe8', fontSize: '0.85rem', margin: '5px 0' }}>Base: {ethers.utils.formatEther(auction.minPrice)} ETH</p>
                          <p style={{ color: '#a855f7', fontWeight: 'bold', marginTop: '10px' }}>👉 Clica para entrar</p>
                        </div>
                      )) : <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Nenhum leilão ativo neste momento.</p>}
                    </div>
                  )}
                </div>
              </>
            )}

            <h3 style={{ color: '#a855f7', borderTop: '1px solid #333', paddingTop: '2rem' }}> Ferramentas</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem', width: '100%' }}>
              <div style={cardStyle}>
                <h4>Forge Digital Collectible (Mint)</h4>
                <input style={inputStyle} placeholder="Nome do Projeto / NFT" onChange={e => setNftName(e.target.value)} />
                <textarea 
                  style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} 
                  placeholder="Descrição ou objetivo do financiamento..." 
                  onChange={e => setNftDescription(e.target.value)} 
                />
                <input type="file" accept="image/*" style={{ ...inputStyle, background: '#1e1e2d', cursor: 'pointer' }} onChange={e => setNftFile(e.target.files[0])} />
                <button style={{ ...btnStyle, background: '#8b5cf6', width: '100%' }} onClick={async () => {
                  try {
                    const formData = new FormData();
                    formData.append('nftImage', nftFile);
                    const resImg = await axios.post('http://localhost:3001/api/upload', formData);
                    const uri = resImg.data.imageUrl;

                    const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                    await (await contract.mintNFT(uri)).wait();

                    await axios.post('http://localhost:3001/api/nfts', {
                      creator: account,
                      tokenUri: uri,
                      name: nftName,
                      description: nftDescription
                    });

                    alert('Ativo forjado com sucesso!');

                    fetchMarketData(account, signer);

const resDb = await axios.get('http://localhost:3001/api/nfts');
    setBackendNfts(resDb.data);

                  } catch (e) { alert(e.message); }
                }}>Criar NFT</button>
              </div>
              
              <div style={cardStyle}>
                <h4>List Asset For Fixed Sale</h4>
                <input style={inputStyle} placeholder="Token ID" onChange={e => setListTokenId(e.target.value)} />
                <input style={inputStyle} placeholder="Preço (ETH ou DEX)" onChange={e => setListPrice(e.target.value)} />
                <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.9rem', color: '#fff' }}>
                  <input type="checkbox" checked={isDexPayment} onChange={e => setIsDexPayment(e.target.checked)} /> Exigir DEX
                </label>
                <button style={{ ...btnStyle, background: '#10b981', width: '100%' }} onClick={
                handleListNftForSale
                }>Publicar Venda</button>
              </div>

              <div style={cardStyle}>
                <h4>Inaugurar Leilão</h4>
                <input style={inputStyle} placeholder="Token ID" onChange={e => setAuctionTokenId(e.target.value)} />
                <input style={inputStyle} placeholder="Preço Base (ETH)" onChange={e => setAuctionMinPrice(e.target.value)} />
                <input style={inputStyle} placeholder="Segundos" onChange={e => setAuctionDuration(e.target.value)} />
                <button style={{ ...btnStyle, background: '#d946ef', width: '100%' }} onClick={
                  handleStartAuction
                }>Abrir Leilão</button>
              </div>
            </div>
          </section>
        )}

       {/* ----------------- SECTOR 3: PEER-TO-PEER PAWNING ----------------- */}
        {activeTab === 'p2p-pawn' && (
          <section>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button style={{ ...btnStyle, background: '#064e3b', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => fetchMarketData(account, signer)}>
                🔄 Atualizar P2P
              </button>
            </div>

            <div style={{ marginBottom: '2.5rem', width: '100%' }}>
              <div onClick={() => setIsP2pMarketOpen(!isP2pMarketOpen)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <h3 style={{ color: '#34d399', margin: 0, userSelect: 'none' }}>{isP2pMarketOpen ? '▼' : '▶'} 🏦 Mercado P2P (Apoiar Projetos)</h3>
              </div>
              <p style={{ color: '#a7f3d0', marginTop: 0, marginBottom: '1rem', fontSize: '0.9rem' }}>Projetos da comunidade a aguardar liquidez. Fornece ETH e retém DEX como garantia.</p>
              
              {isP2pMarketOpen && (
                selectedP2pLoan ? (
                  
                  <div style={{ background: '#022c22', padding: '2rem', borderRadius: '12px', border: '1px solid #059669', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                    
                    <div style={{ flex: '1' }}>
                      <button style={{ ...btnStyle, background: '#064e3b', marginBottom: '1rem' }} onClick={() => setSelectedP2pLoan(null)}>
                        ⬅ Voltar ao Mercado
                      </button>
                      <img src={selectedP2pLoan.uri} alt="NFT Colateral" style={{ width: '100%', borderRadius: '10px', border: '2px solid #10b981' }} />
                    </div>

                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '3rem' }}>
                      
                      {(() => {
                        const meta = backendNfts.find(n => n.tokenUri === selectedP2pLoan.uri) || {};
                        return (
                          <>
                            <h2 style={{ margin: 0, color: '#fff', fontSize: '2rem' }}>
                              {meta.name || `Projeto #${selectedP2pLoan.id.toString()}`}
                            </h2>
                            
                            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                              <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                📝 Descrição do Projeto:
                              </p>
                              <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.5', fontSize: '0.95rem' }}>
                                {meta.description || "Nenhuma descrição fornecida pelo criador para este pedido."}
                              </p>
                            </div>
                          </>
                        );
                      })()}

                      <div style={{ background: '#064e3b', padding: '1rem', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 5px 0', color: '#a7f3d0', fontSize: '0.85rem' }}>👤 Criador:</p>
                        <p style={{ margin: 0, color: '#fff', fontFamily: 'monospace', fontSize: '1.05rem', overflowWrap: 'anywhere' }}>
                          {selectedP2pLoan.borrower}
                        </p>
                      </div>

                      <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                        <p style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '0.85rem' }}>Detalhes do Pedido:</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ color: '#cbd5e1' }}>Capital Requisitado:</span>
                          <b style={{ color: '#fbbf24', fontSize: '1.2rem' }}>
                            {ethers.utils.formatEther(selectedP2pLoan.ethRequested)} ETH
                          </b>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ color: '#cbd5e1' }}>A Tua Caução Requisitada:</span>
                          <b style={{ color: '#38bdf8' }}>
                            {ethers.utils.formatEther(selectedP2pLoan.dexRequired)} DEX
                          </b>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '10px', marginTop: '10px' }}>
                          <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Teu Lucro Estimado (+5%):</span>
                          <b style={{ color: '#10b981', fontSize: '1.2rem' }}>
                            +{ethers.utils.formatEther(selectedP2pLoan.ethRequested.mul(5).div(100))} ETH
                          </b>
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem' }}>
                        <button 
                          style={{ ...btnStyle, background: '#10b981', width: '100%', fontSize: '1.2rem', padding: '1rem' }} 
                          onClick={async () => {
                            try {
                              const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                              const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
                              
                              await (await dexContract.approve(NFT_MARKET_ADDRESS, selectedP2pLoan.dexRequired)).wait();
                              await (await contract.fundNftLoan(selectedP2pLoan.id, { value: selectedP2pLoan.ethRequested })).wait();
                              
                              alert('🎉 Crédito concedido com sucesso! O projeto foi financiado.');
                              setSelectedP2pLoan(null); 
                              fetchMarketData(account, signer); 
                            } catch(e) { alert(e.message); }
                          }}
                        >
                          Apoiar com Liquidez
                        </button>
                      </div>
                    </div>
                  </div>

                ) : (

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                    {allP2pLoans.filter(l => l.active && !l.funded && l.borrower.toLowerCase() !== account.toLowerCase()).map(loan => (
                      <div 
                        key={loan.id} 
                        onClick={() => setSelectedP2pLoan(loan)}
                        style={{ background: '#022c22', padding: '1rem', borderRadius: '8px', border: '1px solid #059669', width: '240px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {loan.uri && <img src={loan.uri} alt="NFT Colateral" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />}
                        <b style={{ color: '#fff', display: 'block' }}>Projeto ID: {loan.id.toString()}</b>
                        <p style={{ color: '#d1fae5', margin: '10px 0' }}>Requisitado: <b style={{color: '#fbbf24'}}>{ethers.utils.formatEther(loan.ethRequested)} ETH</b></p>
                        <p style={{ color: '#34d399', fontWeight: 'bold', marginTop: '10px' }}>👉 Clica para ver detalhes</p>
                      </div>
                    ))}
                    {allP2pLoans.filter(l => l.active && !l.funded && l.borrower.toLowerCase() !== account.toLowerCase()).length === 0 && <p style={{ color: '#aaa' }}>Não há pedidos ativos no mercado.</p>}
                  </div>

                )
              )}
            </div>

            <div style={{ marginBottom: '2.5rem', width: '100%' }}>
              <div onClick={() => setIsP2pInvestmentsOpen(!isP2pInvestmentsOpen)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <h3 style={{ color: '#8b5cf6', margin: 0, userSelect: 'none' }}>{isP2pInvestmentsOpen ? '▼' : '▶'} 💼 Os Meus Investimentos</h3>
              </div>
              
              {isP2pInvestmentsOpen && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                  {allP2pLoans.filter(l => l.provider.toLowerCase() === account.toLowerCase()).map(loan => (
                    <div key={loan.id} style={{ background: '#4c1d95', padding: '1rem', borderRadius: '8px', border: '1px solid #7c3aed', width: '240px', textAlign: 'center' }}>
                      {loan.uri && <img src={loan.uri} alt="NFT Retido" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px', filter: 'grayscale(50%)' }} />}
                      <b style={{ color: '#fff', display: 'block' }}>Loan ID: {loan.id.toString()}</b>
                      <p style={{ color: '#ddd', fontSize: '0.85rem' }}>Investimento: {ethers.utils.formatEther(loan.ethRequested)} ETH</p>
                      
                      {loan.active ? (
                        <button style={{ ...btnStyle, background: '#ef4444', width: '100%', marginTop: '10px' }} onClick={async () => {
                          const now = Math.floor(Date.now() / 1000);
                          if (now <= loan.expiry.toNumber()) {
                            return alert("⚠️ Ação Bloqueada: O prazo do empréstimo ainda não expirou! Só podes forçar a liquidação depois do tempo acabar.");
                          }
                          try {
                            const c = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                            await (await c.liquidateNftLoan(loan.id)).wait();
                            alert('⚖️ Liquidação executada com sucesso! O NFT agora pertence-te.');
                            fetchMarketData(account, signer);
                          } catch(e) { alert(e.message); }
                        }}>Forçar Liquidação</button>
                      ) : (
                        <span style={{ display: 'block', marginTop: '10px', color: '#a78bfa', fontWeight: 'bold' }}>Operação Encerrada</span>
                      )}
                    </div>
                  ))}
                  {allP2pLoans.filter(l => l.provider.toLowerCase() === account.toLowerCase()).length === 0 && <p style={{ color: '#aaa' }}>Ainda não financiaste nenhum projeto.</p>}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2.5rem', width: '100%' }}>
              <div onClick={() => setIsP2pMyLoansOpen(!isP2pMyLoansOpen)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <h3 style={{ color: '#3b82f6', margin: 0, userSelect: 'none' }}>{isP2pMyLoansOpen ? '▼' : '▶'} 📥 Os Meus Pedidos (Estado & Pagamento)</h3>
              </div>
              
              {isP2pMyLoansOpen && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                  {allP2pLoans.filter(l => l.borrower.toLowerCase() === account.toLowerCase()).map(loan => {
                    const totalDueBN = loan.ethRequested.mul(110).div(100);
                    const totalDueEth = ethers.utils.formatEther(totalDueBN);

                    return (
                      <div key={loan.id} style={{ background: '#1e3a8a', padding: '1rem', borderRadius: '8px', border: '1px solid #3b82f6', width: '240px', textAlign: 'center' }}>
                        {loan.uri && <img src={loan.uri} alt="NFT" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />}
                        <b style={{ color: '#fff', display: 'block' }}>Loan ID: {loan.id.toString()}</b>
                        
                        <p style={{ margin: '10px 0', fontSize: '0.85rem', color: loan.funded ? '#34d399' : '#fcd34d', fontWeight: 'bold' }}>
                          Estado: {loan.active ? (loan.funded ? "🟢 Financiado" : "🟠 A aguardar") : "🔴 Encerrado"}
                        </p>
                        
                        {loan.active && loan.funded && (
                          <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px', marginTop: '10px', border: '1px solid #1e293b' }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 5px 0' }}>Total a Liquidar (C/ Juros):</p>
                            <p style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>{totalDueEth} ETH</p>
                            
                            <button style={{ ...btnStyle, background: '#2563eb', width: '100%' }} onClick={async () => {
                               try {
                                 const c = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                                 await (await c.repayNftLoan(loan.id, { value: totalDueBN })).wait();
                                 alert('✅ Dívida saldada com sucesso! O teu NFT voltou para a tua carteira.');
                                 fetchMarketData(account, signer);
                               } catch(e) { alert(e.message); }
                            }}>Pagar e Recuperar NFT</button>
                          </div>
                        )}

                        {loan.active && !loan.funded && (
                           <p style={{ color: '#bfdbfe', fontSize: '0.85rem' }}>Pedido: {ethers.utils.formatEther(loan.ethRequested)} ETH</p>
                        )}
                      </div>
                    );
                  })}
                  {allP2pLoans.filter(l => l.borrower.toLowerCase() === account.toLowerCase()).length === 0 && <p style={{ color: '#aaa' }}>Não tens pedidos de empréstimo criados.</p>}
                </div>
              )}
            </div>

            <h3 style={{ color: '#3b82f6', borderTop: '1px solid #333', paddingTop: '2rem' }}> Ferramentas </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 350px))', gap: '1.5rem', marginBottom: '2rem', width: '100%' }}>
              <div style={{ ...cardStyle, borderColor: '#3b82f6' }}>
                <h4 style={{ color: '#93c5fd', marginTop: 0 }}>Lançar Pedido de Financiamento</h4>
                <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '1rem' }}>Usa um ID da tua Galeria como colateral.</p>
                
                <input id="newLoanId" style={inputStyle} placeholder="Token ID do NFT (Colateral)" />
                <input id="newLoanEth" style={inputStyle} placeholder="ETH Requisitado" />
                <input id="newLoanTime" style={inputStyle} placeholder="Prazo (Segundos)" />
                
                <button style={{ ...btnStyle, background: '#2563eb', width: '100%', marginTop: '10px' }} onClick={
                handleRequestP2pLoan
                }>Solicitar Financiamento</button>
              </div>
            </div>

          </section>
        )}
        
      </div>
    </div>
  );
}