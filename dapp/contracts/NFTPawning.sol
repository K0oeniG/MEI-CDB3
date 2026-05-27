// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// [FIX #2/#6] ReentrancyGuard protege buyNFT, placeBid, repayNftLoan e liquidateNftLoan
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./DecentralizedFinance.sol";

contract NFTPawningMarketplace is ERC721URIStorage, ReentrancyGuard {
    DecentralizedFinance public dexContract;
    uint256 private _tokenIds;
    uint256 private _loanIds;

    struct Listing {
        address seller;
        uint256 price;
        bool isDexPayment;
        bool active;
    }

    struct Auction {
        address seller;
        uint256 minPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    struct NftLoan {
        address borrower;
        address provider;
        uint256 tokenId;
        uint256 ethRequested;
        uint256 dexRequired;
        uint256 expiry;
        bool funded;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => NftLoan) public nftLoans;


    mapping(address => uint256) public pendingRefunds;

    address payable public dappOwner;

    event NFTMinted(address indexed owner, uint256 tokenId, string tokenURI);
    event NFTListed(uint256 indexed tokenId, uint256 price, bool isDexPayment);
   
    event NFTListingCancelled(uint256 indexed tokenId);
    event NFTSold(uint256 indexed tokenId, address buyer, address seller, uint256 price);
    event AuctionStarted(uint256 indexed tokenId, uint256 minPrice, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address bidder, uint256 amount);
    
    event BidRefundAvailable(address indexed bidder, uint256 amount);
    event NftLoanRequested(uint256 indexed loanId, address borrower, uint256 tokenId, uint256 ethRequested);
    event NftLoanFunded(uint256 indexed loanId, address provider);
    event NftLoanRepaid(uint256 indexed loanId);
    event NftLoanLiquidated(uint256 indexed loanId);

    constructor(address payable _dexContractAddress) ERC721("DAppNFT", "DNFT") {
   
        require(_dexContractAddress != address(0), "Endereco DEX invalido.");
        dexContract = DecentralizedFinance(_dexContractAddress);
        dappOwner = payable(msg.sender);
    }

    // ==========================================
    // NFT BASE INTERFACE (MINT / BURN)
    // ==========================================

    function mintNFT(string memory tokenURI) external returns (uint256) {
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        emit NFTMinted(msg.sender, newItemId, tokenURI);
        return newItemId;
    }

    function burnNFT(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Nao e o dono do NFT.");
        _burn(tokenId);
    }

    // ==========================================
    // NFT MARKETPLACE (FIXED SALES)
    // ==========================================

    function listNFT(uint256 tokenId, uint256 price, bool isDexPayment) external {
        require(ownerOf(tokenId) == msg.sender, "Nao e o dono.");
        require(price > 0, "Preco deve ser maior que zero.");
        require(getApproved(tokenId) == address(this), "Precisa aprovar o contrato primeiro.");

        listings[tokenId] = Listing(msg.sender, price, isDexPayment, true);
        emit NFTListed(tokenId, price, isDexPayment);
    }


    function buyNFT(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "NFT nao esta a venda.");
        require(listing.seller != msg.sender, "Nao pode comprar o proprio NFT.");

        address seller = listing.seller;
        uint256 totalPrice = listing.price;
        uint256 ownerFee = (totalPrice * 5) / 100;
        uint256 sellerShare = totalPrice - ownerFee;

    
        listing.active = false;

        if (listing.isDexPayment) {
            require(dexContract.balanceOf(msg.sender) >= totalPrice, "DEX insuficiente.");

          
            dexContract.transferFrom(msg.sender, dappOwner, ownerFee);
            dexContract.transferFrom(msg.sender, seller, sellerShare);
        } else {
            require(msg.value == totalPrice, "ETH incorreto enviado.");

            
            (bool feeSuccess, ) = dappOwner.call{value: ownerFee}("");
            require(feeSuccess, "Falha na taxa do owner.");

            (bool sellerSuccess, ) = payable(seller).call{value: sellerShare}("");
            require(sellerSuccess, "Falha na transferencia de ETH ao vendedor.");
        }

        
        _transfer(seller, msg.sender, tokenId);
        emit NFTSold(tokenId, msg.sender, seller, totalPrice);
    }

    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "A listagem nao esta ativa.");
        require(listing.seller == msg.sender, "Apenas o vendedor pode cancelar.");

        listing.active = false;
    
        emit NFTListingCancelled(tokenId);
    }

    // ==========================================
    // NFT AUCTIONS (TIMED OPEN-BIDDING)
    // ==========================================

    function startAuction(uint256 tokenId, uint256 minPrice, uint256 durationSecs) external {
        require(ownerOf(tokenId) == msg.sender, "Nao e o dono.");
        require(minPrice > 0, "Preco minimo deve ser maior que zero.");
        require(durationSecs > 0, "Duracao invalida.");
        require(getApproved(tokenId) == address(this), "Aprove o contrato.");

        transferFrom(msg.sender, address(this), tokenId);
        auctions[tokenId] = Auction(msg.sender, minPrice, 0, address(0), block.timestamp + durationSecs, true);
        emit AuctionStarted(tokenId, minPrice, block.timestamp + durationSecs);
    }

    
    function placeBid(uint256 tokenId) external payable nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(msg.sender != auction.seller, "O dono nao pode licitar.");
        require(auction.active, "Leilao inativo.");
        require(block.timestamp < auction.endTime, "Leilao terminado.");
        require(msg.value > auction.minPrice, "Abaixo do preco minimo.");
        require(msg.value > auction.highestBid, "Ja existe uma licitacao maior.");

        if (auction.endTime - block.timestamp <= 5) {
            auction.endTime += 10;
        }

       
        if (auction.highestBidder != address(0)) {
            pendingRefunds[auction.highestBidder] += auction.highestBid;
            emit BidRefundAvailable(auction.highestBidder, auction.highestBid);
        }

        
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    
    function withdrawRefund() external nonReentrant {
        uint256 amount = pendingRefunds[msg.sender];
        require(amount > 0, "Sem reembolso pendente.");

        
        pendingRefunds[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Falha no reembolso.");
    }

    
    function endAuction(uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Nao ativo.");
        require(block.timestamp >= auction.endTime, "Leilao ainda decorre.");

        
        auction.active = false;
        address seller = auction.seller;
        address winner = auction.highestBidder;
        uint256 totalBid = auction.highestBid;

        if (winner != address(0)) {
            uint256 ownerFee = (totalBid * 5) / 100;
            uint256 sellerShare = totalBid - ownerFee;

     
            (bool feeSuccess, ) = dappOwner.call{value: ownerFee}("");
            require(feeSuccess, "Falha na taxa do owner.");

            (bool sellerSuccess, ) = payable(seller).call{value: sellerShare}("");
            require(sellerSuccess, "Falha ao pagar vendedor.");

            _transfer(address(this), winner, tokenId);
            emit NFTSold(tokenId, winner, seller, totalBid);
        } else {
            _transfer(address(this), seller, tokenId);
        }
    }

    // ==========================================
    // NFT ETHER LENDING WITH P2P DEX BACKING
    // ==========================================

    function requestNftLoan(uint256 tokenId, uint256 ethRequested, uint256 durationSecs) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Nao possui o NFT.");
        require(ethRequested > 0, "Valor pedido invalido.");
        require(durationSecs > 0, "Duracao invalida.");
        require(getApproved(tokenId) == address(this), "Aprove o contrato.");

        // EFFECTS: NFT em custódia antes de registar o pedido
        _transfer(msg.sender, address(this), tokenId);

        uint256 swapRate = dexContract.dexSwapRate();
        uint256 dexRequired = (ethRequested * 10**18) / swapRate;

        _loanIds++;
        nftLoans[_loanIds] = NftLoan({
            borrower: msg.sender,
            provider: address(0),
            tokenId: tokenId,
            ethRequested: ethRequested,
            dexRequired: dexRequired,
            expiry: durationSecs,
            funded: false,
            active: true
        });

        emit NftLoanRequested(_loanIds, msg.sender, tokenId, ethRequested);
    }

    function fundNftLoan(uint256 loanId) external payable nonReentrant {
        NftLoan storage loanData = nftLoans[loanId];
        require(loanData.active && !loanData.funded, "Pedido de emprestimo indisponivel.");
        require(msg.value == loanData.ethRequested, "Tens de enviar o valor exato de ETH pedido.");
        require(dexContract.balanceOf(msg.sender) >= loanData.dexRequired, "DEX insuficiente para colateral.");

        // EFFECTS: atualizar estado antes de interações externas
        loanData.provider = msg.sender;
        loanData.funded = true;
        loanData.expiry = block.timestamp + loanData.expiry;

        address borrower = loanData.borrower;
        uint256 dexRequired = loanData.dexRequired;
        uint256 ethRequested = loanData.ethRequested;

        // INTERACTIONS: DEX do provider em custódia
        dexContract.transferFrom(msg.sender, address(this), dexRequired);

        // INTERACTIONS: ETH enviado ao mutuário
        (bool success, ) = payable(borrower).call{value: ethRequested}("");
        require(success, "Liquidez de ETH falhou.");

        emit NftLoanFunded(loanId, msg.sender);
    }

 function repayNftLoan(uint256 loanId) external payable nonReentrant {
        NftLoan storage loanData = nftLoans[loanId];
        require(loanData.funded && loanData.active, "Contrato inativo.");
        require(block.timestamp <= loanData.expiry, "Prazo expirado! Use a liquidacao.");
        require(msg.sender == loanData.borrower, "Apenas o mutuario pode pagar.");

        uint256 totalInterest = (loanData.ethRequested * 10) / 100;
        uint256 totalDue = loanData.ethRequested + totalInterest;
        require(msg.value == totalDue, "Montante incorreto.");

        loanData.active = false;

        address provider = loanData.provider;
        address borrower = loanData.borrower;
        uint256 tokenId = loanData.tokenId;
        uint256 dexRequired = loanData.dexRequired;

        // O Provider recebe o capital original + a sua parte dos juros
        uint256 providerShare = totalInterest / 2;
        uint256 totalToProvider = loanData.ethRequested + providerShare; 

        // 1. Devolve o colateral DEX ao provider
        dexContract.transfer(provider, dexRequired);

        // 2. Envia o total (Principal + Juros) ao provider
        (bool pSuccess, ) = payable(provider).call{value: totalToProvider}("");
        require(pSuccess, "Falha no pagamento do Provedor.");

        // 3. Devolve o NFT ao mutuário
        _transfer(address(this), borrower, tokenId);

        emit NftLoanRepaid(loanId);
    }


    
    function liquidateNftLoan(uint256 loanId) external nonReentrant {
        NftLoan storage loanData = nftLoans[loanId];
        require(loanData.funded && loanData.active, "Inativo.");
        require(block.timestamp > loanData.expiry, "Prazo ainda nao expirou.");

        
        loanData.active = false;

        address provider = loanData.provider;
        uint256 tokenId = loanData.tokenId;
        uint256 dexRequired = loanData.dexRequired;


        // NFT vai para o provider como compensação pelo incumprimento
        _transfer(address(this), provider, tokenId);

        
        dexContract.transfer(provider, dexRequired);

        emit NftLoanLiquidated(loanId);
    }
}
