import { useState } from 'react';
import { ethers } from 'ethers';

const DEX_ABI = [
  "function setDexSwapRate(uint256 _newRate) external",
  "function setGlobalParams(uint256 _cycle, uint256 _interest, uint256 _fee, uint256 _maxDuration) external"
];
const DEX_ADDRESS = "d9145CCE52D386f254917e481eB44e9943F39138";

export default function AdminConsole() {
  const [rate, setRate] = useState('');
  const [cycle, setCycle] = useState('');
  const [interest, setInterest] = useState('');
  const [fee, setFee] = useState('');
  const [maxDuration, setMaxDuration] = useState('');

  const getSigner = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    return provider.getSigner();
  };

  const updateRate = async () => {
    try {
      const sig = await getSigner();
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, sig);
      const tx = await contract.setDexSwapRate(ethers.utils.parseEther(rate));
      await tx.wait();
      alert('Swap Rate updated dynamically!');
    } catch (err) { alert(err.message); }
  };

  const updateParams = async () => {
    try {
      const sig = await getSigner();
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, sig);
      const tx = await contract.setGlobalParams(cycle, interest, ethers.utils.parseEther(fee), maxDuration);
      await tx.wait();
      alert('Global Parameters modified globally!');
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ padding: '3rem', fontFamily: 'sans-serif' }}>
      <h1>DApp Protocol Control Console (Admin Only)</h1>
      <hr />
      <div style={{ marginBottom: '2rem' }}>
        <h3>Modify Token Exchange Valuation</h3>
        <input placeholder="New Swap Rate (in Wei)" value={rate} onChange={e => setRate(e.target.value)} />
        <button onClick={updateRate}>Push Adjustment</button>
      </div>
      <div>
        <h3>Adjust System Loan Parameters</h3>
        <input placeholder="Cycle Span (Secs)" onChange={e => setCycle(e.target.value)} /><br/>
        <input placeholder="Interest percentage (e.g. 10)" onChange={e => setInterest(e.target.value)} /><br/>
        <input placeholder="Termination Penalty (Wei)" onChange={e => setFee(e.target.value)} /><br/>
        <input placeholder="Max Permitted Lifespan" onChange={e => setMaxDuration(e.target.value)} /><br/>
        <button onClick={updateParams}>Save Configuration</button>
      </div>
    </div>
  );
}