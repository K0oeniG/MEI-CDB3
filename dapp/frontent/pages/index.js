import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Paste your compiled contract ABIs here after compiling in Remix/Hardhat
const DEX_ABI = [
  "function buyDex() external payable",
  "function sellDex(uint256 dexAmount) external",
  "function loan(uint256 dexAmount, uint256 deadline) external returns (uint256)",
  "function makePayment(uint256 loanId) external payable",
  "function balanceOf(address account) external view returns (uint256)",
  "function dexSwapRate() external view returns (uint256)"
];

const NFT_MARKET_ABI = [
  "function mintNFT(string memory tokenURI) external returns (uint256)",
  "function listNFT(uint256 tokenId, uint256 price, bool isDexPayment) external",
  "function buyNFT(uint256 tokenId) external payable",
  "function requestNftLoan(uint256 tokenId, uint256 ethRequested, uint256 durationSecs) external",
  "function fundNftLoan(uint256 loanId) external",
  "function repayNftLoan(uint256 loanId) external payable",
  "function approve(address to, uint256 tokenId) external"
];

const DEX_ADDRESS = "d9145CCE52D386f254917e481eB44e9943F39138";
const NFT_MARKET_ADDRESS = "d8b934580fcE35a11B58C6D73aDeE468a2833fa8";

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('dex');
  
  // Form/UI States
  const [dexAmount, setDexAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [loanCollateral, setLoanCollateral] = useState('');
  const [loanDeadline, setLoanDeadline] = useState('');
  const [paymentLoanId, setPaymentLoanId] = useState('');
  const [paymentValue, setPaymentValue] = useState('');
  
  // NFT States
  const [nftUri, setNftUri] = useState('');
  const [listTokenId, setListTokenId] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [isDexPayment, setIsDexPayment] = useState(false);
  const [p2pLoanId, setP2pLoanId] = useState('');
  const [p2pEthRequest, setP2pEthRequest] = useState('');

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(prov);
    }
  }, []);

  const connectWallet = async () => {
    if (!provider) return alert('MetaMask not detected!');
    await provider.send("eth_requestAccounts", []);
    const sig = provider.getSigner();
    setSigner(sig);
    const addr = await sig.getAddress();
    setAccount(addr);
  };

  // --- Contract Interaction Actions ---
  const handleBuyDex = async () => {
    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.buyDex({ value: ethers.utils.parseEther(ethAmount) });
      await tx.wait();
      alert('DEX Tokens purchased successfully!');
    } catch (err) { alert(err.message); }
  };

  const handleSellDex = async () => {
    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.sellDex(ethers.utils.parseEther(dexAmount));
      await tx.wait();
      alert('DEX Tokens sold successfully!');
    } catch (err) { alert(err.message); }
  };

  const handleTakeLoan = async () => {
    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.loan(ethers.utils.parseEther(loanCollateral), loanDeadline);
      await tx.wait();
      alert('Loan initiated!');
    } catch (err) { alert(err.message); }
  };

  const handleMakePayment = async () => {
    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.makePayment(paymentLoanId, { value: ethers.utils.parseEther(paymentValue) });
      await tx.wait();
      alert('Payment processed!');
    } catch (err) { alert(err.message); }
  };

  const handleMintNft = async () => {
    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      const tx = await contract.mintNFT(nftUri);
      const receipt = await tx.wait();
      
      // Notify off-chain database about the newly minted token
      await fetch('http://localhost:3001/api/nfts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator: account, tokenUri: nftUri })
      });
      alert('NFT Minted and cached to server state!');
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Decentralized Finance & NFT Pawning Hub</h1>
      <button onClick={connectWallet} style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}>
        {account ? `Connected: ${account.substring(0,6)}...` : 'Connect Wallet'}
      </button>

      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('dex')}>DEX Exchange & Loans</button>
        <button onClick={() => setActiveTab('nft-market')}>NFT Marketplace</button>
        <button onClick={() => setActiveTab('p2p-pawn')}>P2P NFT Pawn Loans</button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dex' && (
        <section>
          <h2>DEX Market Exchange</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <h3>Buy DEX</h3>
              <input placeholder="ETH Amount" onChange={e => setEthAmount(e.target.value)} />
              <button onClick={handleBuyDex}>Execute Buy</button>
            </div>
            <div>
              <h3>Sell DEX</h3>
              <input placeholder="DEX Amount" onChange={e => setDexAmount(e.target.value)} />
              <button onClick={handleSellDex}>Execute Sell</button>
            </div>
          </div>
          <hr/>
          <h2>Standard Collateralized Lending Pool</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div>
              <h3>Request Loan</h3>
              <input placeholder="DEX Collateral Amount" onChange={e => setLoanCollateral(e.target.value)} /><br/>
              <input placeholder="Deadline Cycles (e.g. 3)" onChange={e => setLoanDeadline(e.target.value)} /><br/>
              <button onClick={handleTakeLoan}>Process Loan</button>
            </div>
            <div>
              <h3>Repay Installment</h3>
              <input placeholder="Loan ID" onChange={e => setPaymentLoanId(e.target.value)} /><br/>
              <input placeholder="ETH Payback Value" onChange={e => setPaymentValue(e.target.value)} /><br/>
              <button onClick={handleMakePayment}>Submit Payment</button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'nft-market' && (
        <section>
          <h2>NFT Forge & Showroom</h2>
          <div style={{ marginBottom: '2rem' }}>
            <h3>Mint Digital Collectible</h3>
            <input placeholder="Metadata Content/URI String" style={{ width: '300px' }} onChange={e => setNftUri(e.target.value)} />
            <button onClick={handleMintNft}>Forge Asset</button>
          </div>
          <div>
            <h3>List Asset For Sale</h3>
            <input placeholder="Token ID" onChange={e => setListTokenId(e.target.value)} /><br/>
            <input placeholder="Target Asking Price" onChange={e => setListPrice(e.target.value)} /><br/>
            <label>
              <input type="checkbox" checked={isDexPayment} onChange={e => setIsDexPayment(e.target.checked)} /> Demand DEX Denomination
            </label><br/>
            <button onClick={async () => {
              const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
              const appTx = await contract.approve(NFT_MARKET_ADDRESS, listTokenId);
              await appTx.wait();
              const tx = await contract.listNFT(listTokenId, ethers.utils.parseEther(listPrice), isDexPayment);
              await tx.wait();
              alert('NFT listed for sale.');
            }}>List Item</button>
          </div>
        </section>
      )}

      {activeTab === 'p2p-pawn' && (
        <section>
          <h2>Peer-to-Peer NFT Loan matching</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div>
              <h3>Borrow Liquidity (Lock NFT)</h3>
              <input placeholder="Token ID" onChange={e => setListTokenId(e.target.value)} /><br/>
              <input placeholder="ETH Liquidity Requested" onChange={e => setP2pEthRequest(e.target.value)} /><br/>
              <input placeholder="Loan Lifespan (Seconds)" onChange={e => setLoanDeadline(e.target.value)} /><br/>
              <button onClick={async () => {
                const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                await (await contract.approve(NFT_MARKET_ADDRESS, listTokenId)).wait();
                await (await contract.requestNftLoan(listTokenId, ethers.utils.parseEther(p2pEthRequest), loanDeadline)).wait();
                alert('P2P Loan Request Registered.');
              }}>Lock NFT & Request</button>
            </div>
            <div>
              <h3>Provide Security (Back with DEX)</h3>
              <input placeholder="Active Loan ID" onChange={e => setP2pLoanId(e.target.value)} /><br/>
              <button onClick={async () => {
                const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                await (await contract.fundNftLoan(p2pLoanId)).wait();
                alert('Loan Backed. Yield tracking online.');
              }}>Back Loan</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}