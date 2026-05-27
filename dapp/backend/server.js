const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); 

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// CONFIGURAÇÃO DO UPLOAD DE IMAGENS 
// ==========================================


const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// 2. Diz ao Express para servir os ficheiros desta pasta publicamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//  Configura o Multer (Onde guardar e com que nome)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });


// ==========================================
// BASE DE DADOS 
// ==========================================


const DB_FILE = path.join(__dirname, 'db.json');


if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], nfts: [], loansHistory: [] }, null, 2));
}


const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));


// ==========================================
//  ROTAS DE AUTENTICAÇÃO
// ==========================================

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
// ROTAS DE NFTS E UPLOADS
// ==========================================

// Receber imagem do Frontend
app.post('/api/upload', upload.single('nftImage'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada" });
  
  const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
  res.json({ imageUrl: imageUrl });
});


app.get('/api/nfts', (req, res) => {
    const db = readDB();
    res.json(db.nfts || []);
});


app.post('/api/nfts', (req, res) => {
  
    const { creator, tokenUri, name, description } = req.body; 
    const db = readDB();
    
    if (!db.nfts) db.nfts = [];

    const newNft = {
        id: db.nfts.length + 1,
        creator,
        tokenUri,
        name: name || "Projeto Sem Nome",                 
        description: description || "Sem descrição.",   
        timestamp: new Date().toISOString()
    };
    
    db.nfts.push(newNft);
    writeDB(db);
    res.status(201).json(newNft);
});



// ==========================================
// 3. ROTA CONFIGURAÇÕES DA BLOCKCHAIN
// ==========================================
const CONFIG_FILE = path.join(__dirname, 'contractConfig.json');

app.get('/api/blockchain/config', (req, res) => {
  if (!fs.existsSync(CONFIG_FILE)) {
    return res.status(404).json({ 
      error: "Configurações da rede não encontradas. Executa o deploy do Hardhat primeiro!" 
    });
  }
  
  const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  res.json(configData);
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Off-chain DApp Server State operational on http://localhost:${PORT}`);
});