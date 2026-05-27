// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./DecentralizedFinance.sol";

contract NFTPawningMarketplace is ERC721URIStorage {
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

    event NFTMinted(address indexed owner, uint256 tokenId, string tokenURI);
    event NFTListed(uint256 indexed tokenId, uint256 price, bool isDexPayment);
    event NFTSold(uint256 indexed tokenId, address buyer, address seller, uint256 price);
    event AuctionStarted(uint256 indexed tokenId, uint256 minPrice, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address bidder, uint256 amount);
    event NftLoanRequested(uint256 indexed loanId, address borrower, uint256 tokenId, uint256 ethRequested);
    event NftLoanFunded(uint256 indexed loanId, address provider);
    event NftLoanRepaid(uint256 indexed loanId);
    event NftLoanLiquidated(uint256 indexed loanId);

    constructor(address payable _dexContractAddress) ERC721("DAppNFT", "DNFT") {
        dexContract = DecentralizedFinance(_dexContractAddress);
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
    //  NFT MARKETPLACE (FIXED SALES)
    // ==========================================
    function listNFT(uint256 tokenId, uint256 price, bool isDexPayment) external {
        require(ownerOf(tokenId) == msg.sender, "Nao e o dono.");
        require(getApproved(tokenId) == address(this), "Precisa aprovar o contrato primeiro.");
        
        listings[tokenId] = Listing(msg.sender, price, isDexPayment, true);
        emit NFTListed(tokenId, price, isDexPayment);
    }

    function buyNFT(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(listing.active, "NFT nao esta a venda.");
        address seller = listing.seller;

        if (listing.isDexPayment) {
            require(dexContract.balanceOf(msg.sender) >= listing.price, "DEX insuficiente.");
            dexContract.transferFrom(msg.sender, seller, listing.price);
        } else {
            require(msg.value == listing.price, "ETH incorreto enviado.");
            (bool success, ) = payable(seller).call{value: listing.price}("");
            require(success, "Falha na transferencia de ETH.");
        }

        _transfer(seller, msg.sender, tokenId);
        listing.active = false;
        emit NFTSold(tokenId, msg.sender, seller, listing.price);
    }



    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "A listagem nao esta ativa.");
        require(listing.seller == msg.sender, "Apenas o vendedor pode cancelar.");


        listing.active = false;
        
      
    }



    // ==========================================
    //  NFT AUCTIONS (TIMED OPEN-BIDDING)
    // ==========================================
    function startAuction(uint256 tokenId, uint256 minPrice, uint256 durationSecs) external {
        require(ownerOf(tokenId) == msg.sender, "Nao e o dono.");
        require(getApproved(tokenId) == address(this), "Aprove o contrato.");

        transferFrom(msg.sender, address(this), tokenId); // Lock NFT in escrow
        auctions[tokenId] = Auction(msg.sender, minPrice, 0, address(0), block.timestamp + durationSecs, true);
        emit AuctionStarted(tokenId, minPrice, block.timestamp + durationSecs);
    }

    function placeBid(uint256 tokenId) external payable {
        Auction storage auction = auctions[tokenId];
        require(msg.sender != auction.seller, "O dono nao pode licitar.");
        require(auction.active, "Leilao inativo.");
        require(block.timestamp < auction.endTime, "Leilao terminado.");
        require(msg.value > auction.minPrice, "Abaixo do preco minimo.");
        require(msg.value > auction.highestBid, "Ja existe uma licitacao maior.");

        
        if (auction.endTime - block.timestamp <= 5) {
            auction.endTime += 10;
        }

        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            (bool success, ) = payable(auction.highestBidder).call{value: auction.highestBid}("");
            require(success, "Falha no reembolso.");
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function endAuction(uint256 tokenId) external {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Nao ativo.");
        require(block.timestamp >= auction.endTime, "Leilao ainda decorre.");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // Transfer ETH to seller
            (bool success, ) = payable(auction.seller).call{value: auction.highestBid}("");
            require(success, "Falha ao pagar vendedor.");
            // Transfer NFT to winner
            _transfer(address(this), auction.highestBidder, tokenId);
            emit NFTSold(tokenId, auction.highestBidder, auction.seller, auction.highestBid);
        } else {
            // Return NFT to seller if no bids
            _transfer(address(this), auction.seller, tokenId);
        }
    }

    // ==========================================
    //  NFT ETHER LENDING WITH P2P DEX BACKING
    // ==========================================
    function requestNftLoan(uint256 tokenId, uint256 ethRequested, uint256 durationSecs) external {
        require(ownerOf(tokenId) == msg.sender, "Nao possui o NFT.");
        require(getApproved(tokenId) == address(this), "Aprove o contrato.");

        _transfer(msg.sender, address(this), tokenId); // Escrow the NFT

        // Dynamically calculate how much DEX the backend backer needs to put down 
        // Example formula: Equivalent value in DEX based on global swap rate
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

    function fundNftLoan(uint256 loanId) external payable{
        NftLoan storage loan = nftLoans[loanId];

        require(loan.active && !loan.funded, "Pedido de emprestimo indisponivel.");

        require(msg.value == loan.ethRequested, "Tens de enviar o valor exato de ETH pedido.");

        require(dexContract.balanceOf(msg.sender) >= loan.dexRequired, "DEX insuficiente para colateral.");

        // Pull DEX security from Provider into this contract
        dexContract.transferFrom(msg.sender, address(this), loan.dexRequired);

        loan.provider = msg.sender;
        loan.funded = true;
        loan.expiry = block.timestamp + loan.expiry; // Lock absolute deadline timestamp

        // Request standard DeFi pool to wire the liquidity to the borrower
        (bool success, ) = payable(loan.borrower).call{value: loan.ethRequested}("");
        require(success, "Liquidez de ETH falhou.");

        emit NftLoanFunded(loanId, msg.sender);
    }

    function repayNftLoan(uint256 loanId) external payable {
        NftLoan storage loan = nftLoans[loanId];
        require(loan.funded && loan.active, "Contrato inativo.");
        require(block.timestamp <= loan.expiry, "Prazo expirado! Use a liquidacao.");
        require(msg.sender == loan.borrower, "Apenas o mutuario pode pagar.");

        // Calculate a 10% plain interest on top of principal
        uint256 totalInterest = (loan.ethRequested * 10) / 100;
        uint256 totalDue = loan.ethRequested + totalInterest;
        require(msg.value == totalDue, "Montante incorreto.");

        loan.active = false;

        // Split profits: 50% interest to the DApp pool, 50% interest to the Liquidity Provider
        uint256 providerShare = totalInterest / 2;
        
        // Return DEX backing deposit back to the provider + their profit share in ETH
        dexContract.transfer(loan.provider, loan.dexRequired);
        (bool pSuccess, ) = payable(loan.provider).call{value: providerShare}("");
        require(pSuccess, "Falha no pagamento do Provedor.");

        // Return NFT to original borrower
        _transfer(address(this), loan.borrower, loan.tokenId);

        emit NftLoanRepaid(loanId);
    }

    function liquidateNftLoan(uint256 loanId) external {
        NftLoan storage loan = nftLoans[loanId];
        require(loan.funded && loan.active, "Inativo.");
        require(block.timestamp > loan.expiry, "Prazo ainda nao expirou.");

        loan.active = false;

        // Liquidity Provider gets rewarded with the forfeited NFT
        _transfer(address(this), loan.provider, loan.tokenId);

        // The DApp contract confiscates the provider's DEX tokens to recover the unreturned ETH principal
        dexContract.transfer(address(dexContract), loan.dexRequired);

        emit NftLoanLiquidated(loanId);
    }
}