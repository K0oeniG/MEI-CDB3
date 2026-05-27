# MEI-CDB3 - DEX-NFT Pawning DApp
GRUPO - 6

Este projeto implementa uma aplicação descentralizada (DApp)  para a gestão de tokens substituíveis (ERC20) e ativos digitais únicos (ERC721). O ecossistema inclui um mercado DEX, pools de empréstimo standard com colateral em DEX, um marketplace de NFTs com leilões cronometrados e um sistema de empréstimos Peer-to-Peer (P2P) com colateralização de NFTs e garantias digitais em DEX.

## Pré-requisitos

* **Node.js** & **npm** instalados
* Extensão **MetaMask** instalada no navegador

---

## Como Publicar e Executar (Rede Local Hardhat)

Este projeto utiliza o Hardhat para automatizar o ciclo de compilação e publicação. Para executar a solução completa, deverás abrir **3 terminais independentes** em simultâneo:

### Passo 1: Iniciar a Blockchain Local (Terminal 1)

Na diretoria raiz do projeto, inicializa o nó local do Hardhat:

```bash
npx hardhat node
```

Mantém este terminal aberto. O Hardhat irá criar 20 contas de teste locais, cada uma carregada com 10.000 ETH fictícios, listando as suas chaves públicas e privadas.

### Passo 2: Executar o Deploy dos Contratos (Terminal 2)

Num segundo terminal, executa o script de publicação automática:

```bash
npx hardhat run deploy.js --network localhost
```

Este script compila os contratos inteligentes `DecentralizedFinance.sol` e `NFTPawningMarketplace.sol`, faz o deploy na rede local e exporta automaticamente as ABIs e os endereços gerados para o backend através do ficheiro `contractConfig.json` .

>  **Nota Importante para a Consola de Administração:** Como o endereço no Frontend está temporariamente fixo na linha 11 do ficheiro `frontend/pages/admin.js`, copia o endereço impresso no terminal para o contrato DEX e cola-o na variável `DEX_ADDRESS` desse ficheiro.

### Passo 3: Iniciar o Servidor Off-chain / Backend (Terminal 2 ou 3)

Navega até à pasta do backend e inicia o servidor Node.js/Express (que ficará ativo no porto 3001):

```bash
cd backend
node server.js
```

O servidor é responsável pela autenticação de utilizadores, gestão e persistência local de metadados (`db.json`), upload de imagens dos NFTs (via Multer) e partilha dinâmica das configurações da blockchain com o Frontend.

### Passo 4: Iniciar a Interface / Frontend (Terminal 3)

Navega até à pasta do frontend e inicia a aplicação em ambiente de desenvolvimento Next.js:

```bash
cd frontend
npm run dev
```

Abre o teu navegador e acede a [http://localhost:3000](http://localhost:3000).

---

## Configuração da Carteira MetaMask

Para conseguires interagir, assinar transações e testar as funcionalidades da DApp, configura a tua MetaMask para apontar para a rede local:

### Adicionar a Rede Local

1. Abre a MetaMask → Clica no menu de **Redes** → **Adicionar Rede** → **Adicionar rede manualmente**
2. Preenche os seguintes campos:
    - **Nome da Rede:** Hardhat Localhost
    - **URL de RPC:** `http://127.0.0.1:8545`
    - **ID da Cadeia (Chain ID):** `31337`
    - **Símbolo da Moeda:** ETH
3. Guarda as alterações e muda para esta nova rede

### Importar Contas de Teste

Como a tua carteira pessoal não terá fundos nesta rede local, deves importar uma das contas do Hardhat:

1. No **Terminal 1** (onde corre o `npx hardhat node`), copia uma das **Private Keys** geradas
2. Na MetaMask, clica no menu de **Contas** → **Importar Conta**
3. Cola a chave privada e clica em **Importar**

Passarás a dispor de fundos para testar livremente a criação de NFTs, swaps de DEX e pedidos de empréstimo.

---

## Estrutura do Projeto

```
MEI-CDB3/
├── contracts/              # Contratos inteligentes Solidity
│   ├── DecentralizedFinance.sol
│   └── NFTPawningMarketplace.sol
├── backend/               # Servidor Node.js/Express
│   ├── server.js
│   ├── db.json
│   └── contractConfig.json
├── frontend/              # Interface Next.js
│   ├── pages/
│   │   └── admin.js
│   └── ...
├── deploy.js             # Script de deploy automático
└── hardhat.config.js     # Configuração do Hardhat
```

---

## Funcionalidades Principais

- **Mercado DEX** - Troca descentralizada de tokens ERC20
- **Pools de Empréstimo** - Sistema de empréstimos com colateral em DEX
- **Marketplace de NFTs** - Compra, venda e leilões cronometados de NFTs
- **Sistema P2P** - Empréstimos peer-to-peer com colateralização de NFTs

---

