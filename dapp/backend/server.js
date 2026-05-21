const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Definir o caminho da base de dados local
const DB_FILE = path.join(__dirname, 'db.json');

// Inicializar a base de dados se ela não existir
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], nfts: [], loansHistory: [] }, null, 2));
}

// Funções auxiliares para ler e escrever na BD mais facilmente
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));


// ==========================================
// 1. ROTAS DE AUTENTICAÇÃO (NOVAS)
// ==========================================

// Rota de Registo de Utilizador
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  
  if (!db.users) db.users = [];
  
  const userExists = db.users.find(u => u.username === username);
  if (userExists) {
    return res.status(400).json({ error: "Este utilizador já existe." });
  }

  const newUser = { username, password, walletAddress: null };
  db.users.push(newUser);
  writeDB(db);

  res.json({ message: "Conta criada com sucesso!", user: newUser });
});

// Rota de Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  
  if (!db.users) db.users = [];
  
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  res.json({ message: "Login efetuado com sucesso!", user });
});

// Rota para Associar a Carteira Crypto à Conta
app.post('/api/auth/connect-wallet', (req, res) => {
  const { username, walletAddress } = req.body;
  const db = readDB();
  
  if (!db.users) db.users = [];

  const userIndex = db.users.findIndex(u => u.username === username);
  if (userIndex === -1) {
    return res.status(404).json({ error: "Utilizador não encontrado." });
  }

  db.users[userIndex].walletAddress = walletAddress;
  writeDB(db);

  res.json({ message: "Carteira associada com sucesso!", user: db.users[userIndex] });
});


// ==========================================
// 2. ROTAS DE NFTS (DO TEU CÓDIGO ORIGINAL)
// ==========================================

// Get all tracked NFTs
app.get('/api/nfts', (req, res) => {
    const db = readDB();
    res.json(db.nfts || []);
});

// Cache a newly minted NFT from the client
app.post('/api/nfts', (req, res) => {
    const { creator, tokenUri } = req.body;
    const db = readDB();
    
    if (!db.nfts) db.nfts = [];

    const newNft = {
        id: db.nfts.length + 1,
        creator,
        tokenUri,
        timestamp: new Date().toISOString()
    };
    
    db.nfts.push(newNft);
    writeDB(db);
    res.status(201).json(newNft);
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Off-chain DApp Server State operational on http://localhost:${PORT}`);
});