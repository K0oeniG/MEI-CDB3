const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize a simple file database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ nfts: [], loansHistory: [] }, null, 2));
}

// Get all tracked NFTs
app.get('/api/nfts', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    res.json(data.nfts);
});

// Cache a newly minted NFT from the client
app.post('/api/nfts', (req, res) => {
    const { creator, tokenUri } = req.body;
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    
    const newNft = {
        id: db.nfts.length + 1,
        creator,
        tokenUri,
        timestamp: new Date().toISOString()
    };
    
    db.nfts.push(newNft);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    res.status(201).json(newNft);
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Off-chain DApp Server State operational on http://localhost:${PORT}`);
});