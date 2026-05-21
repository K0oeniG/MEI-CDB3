import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Paste your compiled contract ABIs here after compiling in Remix/Hardhat
const DEX_ABI =  [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_dexSwapRate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_paymentCycle",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_interest",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_terminationFee",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_maxLoanDuration",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "allowance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientAllowance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSpender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "valorEsperado",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "valorEnviado",
          "type": "uint256"
        }
      ],
      "name": "ValorIncorreto",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "borrower",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        }
      ],
      "name": "loanCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "borrower",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "loanFinished",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "buyDex",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "checkLoan",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "dexSwapRate",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getDexBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "globalInterest",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "globalPaymentCycle",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "globalTerminationFee",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "dexAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        }
      ],
      "name": "loan",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "loans",
      "outputs": [
        {
          "internalType": "address",
          "name": "borrower",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "collateral",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "paymentCycle",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "interest",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "termination",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastPaymentTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "paymentsMade",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "makePayment",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "maxLoanDuration",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "dexAmount",
          "type": "uint256"
        }
      ],
      "name": "sellDex",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_newRate",
          "type": "uint256"
        }
      ],
      "name": "setDexSwapRate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_cycle",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_interest",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_fee",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_maxDuration",
          "type": "uint256"
        }
      ],
      "name": "setGlobalParams",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "terminateLoan",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ];

const NFT_MARKET_ABI = [
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "_dexContractAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC721IncorrectOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC721InsufficientApproval",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidOperator",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC721NonexistentToken",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "approved",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "minPrice",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "endTime",
          "type": "uint256"
        }
      ],
      "name": "AuctionStarted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_fromTokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_toTokenId",
          "type": "uint256"
        }
      ],
      "name": "BatchMetadataUpdate",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "bidder",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "BidPlaced",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "MetadataUpdate",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "isDexPayment",
          "type": "bool"
        }
      ],
      "name": "NFTListed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "tokenURI",
          "type": "string"
        }
      ],
      "name": "NFTMinted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "NFTSold",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "provider",
          "type": "address"
        }
      ],
      "name": "NftLoanFunded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "NftLoanLiquidated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "NftLoanRepaid",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "borrower",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "ethRequested",
          "type": "uint256"
        }
      ],
      "name": "NftLoanRequested",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "auctions",
      "outputs": [
        {
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "minPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "highestBid",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "highestBidder",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "endTime",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "active",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "burnNFT",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "buyNFT",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "dexContract",
      "outputs": [
        {
          "internalType": "contract DecentralizedFinance",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "endAuction",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "fundNftLoan",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "getApproved",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "liquidateNftLoan",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isDexPayment",
          "type": "bool"
        }
      ],
      "name": "listNFT",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "listings",
      "outputs": [
        {
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isDexPayment",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "active",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "tokenURI",
          "type": "string"
        }
      ],
      "name": "mintNFT",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "nftLoans",
      "outputs": [
        {
          "internalType": "address",
          "name": "borrower",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "provider",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "ethRequested",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "dexRequired",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "expiry",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "funded",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "active",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ownerOf",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "placeBid",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "repayNftLoan",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "ethRequested",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "durationSecs",
          "type": "uint256"
        }
      ],
      "name": "requestNftLoan",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "durationSecs",
          "type": "uint256"
        }
      ],
      "name": "startAuction",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenURI",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ]
    }
];

const DEX_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const NFT_MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export default function Dashboard() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('dex');
  
  // Extra User Info
  const [sessionUser, setSessionUser] = useState(null);
  const [dexBalance, setDexBalance] = useState('0');

  // Form/UI States DEX
  const [dexAmount, setDexAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [loanCollateral, setLoanCollateral] = useState('');
  const [loanDeadline, setLoanDeadline] = useState('');
  const [paymentLoanId, setPaymentLoanId] = useState('');
  const [paymentValue, setPaymentValue] = useState('');
  
  // Form/UI States NFT
  const [nftUri, setNftUri] = useState('');
  const [listTokenId, setListTokenId] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [isDexPayment, setIsDexPayment] = useState(false);
  
  // Form/UI States NFT Auctions (NOVO)
  const [auctionTokenId, setAuctionTokenId] = useState('');
  const [auctionMinPrice, setAuctionMinPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('');
  const [bidTokenId, setBidTokenId] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  // Form/UI States P2P Loans
  const [p2pLoanId, setP2pLoanId] = useState('');
  const [p2pEthRequest, setP2pEthRequest] = useState('');
  const [repayLoanId, setRepayLoanId] = useState(''); // NOVO
  const [repayAmount, setRepayAmount] = useState(''); // NOVO
  const [liquidateLoanId, setLiquidateLoanId] = useState(''); // NOVO

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(prov);
    }
    // Carregar user guardado no login (se existir)
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) setSessionUser(JSON.parse(cachedUser));
  }, []);

  const connectWallet = async () => {
    if (!provider) return alert('MetaMask not detected!');
    await provider.send("eth_requestAccounts", []);
    const sig = provider.getSigner();
    setSigner(sig);
    const addr = await sig.getAddress();
    setAccount(addr);

    // Update DEX Balance when connecting
    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, sig);
      const bal = await contract.balanceOf(addr);
      setDexBalance(ethers.utils.formatEther(bal));
    } catch(e) { console.error("Erro a ler saldo DEX", e) }
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
      await tx.wait();
      
      await fetch('http://localhost:3001/api/nfts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator: account, tokenUri: nftUri })
      });
      alert('NFT Minted and cached to server state!');
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', background: '#111', color: '#eee', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Nexus Protocol Hub</h1>
        <button onClick={connectWallet} style={{ padding: '0.5rem 1rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {account ? `Connected: ${account.substring(0,6)}...` : 'Connect Wallet'}
        </button>
      </div>

      {sessionUser && (
        <div style={{ background: '#1e1e38', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', marginTop: '1rem' }}>
          <p style={{ margin: 0, color: '#a855f7' }}>👋 Bem-vindo, <b>{sessionUser.username}</b>!</p>
        </div>
      )}

      {account && (
         <div style={{ background: '#0b0b12', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #333' }}>
           <h4 style={{ margin: 0, color: '#10b981' }}>O seu Saldo DEX: {dexBalance} DEX</h4>
         </div>
      )}

      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #333', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('dex')} style={{ background: activeTab === 'dex' ? '#444' : '#222', color: '#fff', border: 'none', padding: '0.5rem 1rem' }}>DEX Exchange & Loans</button>
        <button onClick={() => setActiveTab('nft-market')} style={{ background: activeTab === 'nft-market' ? '#444' : '#222', color: '#fff', border: 'none', padding: '0.5rem 1rem' }}>NFT Marketplace</button>
        <button onClick={() => setActiveTab('p2p-pawn')} style={{ background: activeTab === 'p2p-pawn' ? '#444' : '#222', color: '#fff', border: 'none', padding: '0.5rem 1rem' }}>P2P NFT Pawn Loans</button>
      </div>

      {/* -------------------- DEX TAB -------------------- */}
      {activeTab === 'dex' && (
        <section>
          <h2>DEX Market Exchange</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>Buy DEX</h3>
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="ETH Amount" onChange={e => setEthAmount(e.target.value)} />
              <button onClick={handleBuyDex} style={{ padding: '0.5rem', background: '#3b82f6', color: '#fff', border: 'none' }}>Execute Buy</button>
            </div>
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>Sell DEX</h3>
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="DEX Amount" onChange={e => setDexAmount(e.target.value)} />
              <button onClick={handleSellDex} style={{ padding: '0.5rem', background: '#ef4444', color: '#fff', border: 'none' }}>Execute Sell</button>
            </div>
          </div>
          <hr style={{ borderColor: '#333' }}/>
          <h2>Standard Collateralized Lending Pool</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>Request Loan</h3>
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="DEX Collateral Amount" onChange={e => setLoanCollateral(e.target.value)} />
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="Deadline Cycles (e.g. 3)" onChange={e => setLoanDeadline(e.target.value)} />
              <button onClick={handleTakeLoan} style={{ padding: '0.5rem', background: '#10b981', color: '#fff', border: 'none' }}>Process Loan</button>
            </div>
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>Repay Installment</h3>
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="Loan ID" onChange={e => setPaymentLoanId(e.target.value)} />
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="ETH Payback Value" onChange={e => setPaymentValue(e.target.value)} />
              <button onClick={handleMakePayment} style={{ padding: '0.5rem', background: '#f59e0b', color: '#fff', border: 'none' }}>Submit Payment</button>
            </div>
          </div>
        </section>
      )}

      {/* -------------------- NFT MARKET TAB -------------------- */}
      {activeTab === 'nft-market' && (
        <section>
          <h2>NFT Forge & Showroom</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>Mint Digital Collectible</h3>
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem', width: '90%' }} placeholder="Metadata Content/URI String" onChange={e => setNftUri(e.target.value)} />
              <button onClick={handleMintNft} style={{ padding: '0.5rem', background: '#8b5cf6', color: '#fff', border: 'none' }}>Forge Asset</button>
            </div>
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>List Asset For Sale</h3>
              <input style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem' }} placeholder="Token ID" onChange={e => setListTokenId(e.target.value)} />
              <input style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem' }} placeholder="Target Asking Price" onChange={e => setListPrice(e.target.value)} />
              <label style={{ display: 'block', marginBottom: '1rem' }}>
                <input type="checkbox" checked={isDexPayment} onChange={e => setIsDexPayment(e.target.checked)} /> Demand DEX Denomination
              </label>
              <button style={{ padding: '0.5rem', background: '#10b981', color: '#fff', border: 'none' }} onClick={async () => {
                const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                await (await contract.approve(NFT_MARKET_ADDRESS, listTokenId)).wait();
                await (await contract.listNFT(listTokenId, ethers.utils.parseEther(listPrice), isDexPayment)).wait();
                alert('NFT listed for sale.');
              }}>List Item</button>
            </div>
          </div>

          <hr style={{ borderColor: '#333' }}/>
          
          <h2>NFT Auctions (Leilões)</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>Inaugurar Leilão</h3>
              <input style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem' }} placeholder="Token ID" onChange={e => setAuctionTokenId(e.target.value)} />
              <input style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem' }} placeholder="Preço Mínimo (ETH)" onChange={e => setAuctionMinPrice(e.target.value)} />
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="Duração (Segundos)" onChange={e => setAuctionDuration(e.target.value)} />
              <button style={{ padding: '0.5rem', background: '#f59e0b', color: '#fff', border: 'none' }} onClick={async () => {
                const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                await (await contract.approve(NFT_MARKET_ADDRESS, auctionTokenId)).wait();
                await (await contract.startAuction(auctionTokenId, ethers.utils.parseEther(auctionMinPrice), auctionDuration)).wait();
                alert('Leilão iniciado!');
              }}>Iniciar Leilão</button>
            </div>

            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>Licitar (Fazer Bid)</h3>
              <input style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem' }} placeholder="Token ID em Leilão" onChange={e => setBidTokenId(e.target.value)} />
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="Sua Oferta (ETH)" onChange={e => setBidAmount(e.target.value)} />
              <button style={{ padding: '0.5rem', background: '#3b82f6', color: '#fff', border: 'none' }} onClick={async () => {
                const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                await (await contract.placeBid(bidTokenId, { value: ethers.utils.parseEther(bidAmount) })).wait();
                alert('Licitação feita com sucesso!');
              }}>Licitar</button>
            </div>
          </div>
        </section>
      )}

      {/* -------------------- P2P NFT PAWN LOANS TAB -------------------- */}
      {activeTab === 'p2p-pawn' && (
        <section>
          <h2>Peer-to-Peer NFT Loan matching</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>1. Pedir Empréstimo (Mutuário)</h3>
              <input style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem' }} placeholder="Token ID (Colateral)" onChange={e => setListTokenId(e.target.value)} />
              <input style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem' }} placeholder="ETH Requisitado" onChange={e => setP2pEthRequest(e.target.value)} />
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="Duração (Segundos)" onChange={e => setLoanDeadline(e.target.value)} />
              <button style={{ padding: '0.5rem', background: '#8b5cf6', color: '#fff', border: 'none' }} onClick={async () => {
                const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                await (await contract.approve(NFT_MARKET_ADDRESS, listTokenId)).wait();
                await (await contract.requestNftLoan(listTokenId, ethers.utils.parseEther(p2pEthRequest), loanDeadline)).wait();
                alert('P2P Loan Request Registered.');
              }}>Bloquear NFT e Pedir ETH</button>
            </div>
            
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>2. Financiar Empréstimo (Provedor)</h3>
              <p style={{ fontSize: '0.8rem', color: '#aaa', margin: '0 0 1rem 0' }}>Exige DEX na sua conta para garantir o negócio.</p>
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="ID do Empréstimo Ativo" onChange={e => setP2pLoanId(e.target.value)} />
              <button style={{ padding: '0.5rem', background: '#10b981', color: '#fff', border: 'none' }} onClick={async () => {
                const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                // Precisamos aprovar o NFT contract para gastar o nosso DEX primeiro
                const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
                const loanData = await contract.nftLoans(p2pLoanId);
                await (await dexContract.approve(NFT_MARKET_ADDRESS, loanData.dexRequired)).wait();
                
                await (await contract.fundNftLoan(p2pLoanId)).wait();
                alert('Empréstimo Financiado!');
              }}>Apoiar Empréstimo</button>
            </div>
          </div>

          <hr style={{ borderColor: '#333' }}/>

          <h2>Pagar ou Liquidar</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>Pagar Dívida (Mutuário)</h3>
              <input style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem' }} placeholder="ID do Empréstimo" onChange={e => setRepayLoanId(e.target.value)} />
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="Total a Pagar (Capital + Juros ETH)" onChange={e => setRepayAmount(e.target.value)} />
              <button style={{ padding: '0.5rem', background: '#3b82f6', color: '#fff', border: 'none' }} onClick={async () => {
                const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                await (await contract.repayNftLoan(repayLoanId, { value: ethers.utils.parseEther(repayAmount) })).wait();
                alert('Dívida paga e NFT recuperado!');
              }}>Pagar e Recuperar NFT</button>
            </div>
            
            <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', width: '50%' }}>
              <h3>Liquidar Caloteiro (Provedor)</h3>
              <p style={{ fontSize: '0.8rem', color: '#aaa', margin: '0 0 1rem 0' }}>Apenas utilizável após o prazo do empréstimo expirar.</p>
              <input style={{ display: 'block', marginBottom: '1rem', padding: '0.5rem' }} placeholder="ID do Empréstimo" onChange={e => setLiquidateLoanId(e.target.value)} />
              <button style={{ padding: '0.5rem', background: '#ef4444', color: '#fff', border: 'none' }} onClick={async () => {
                const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                await (await contract.liquidateNftLoan(liquidateLoanId)).wait();
                alert('Mutuário Liquidado. NFT confiscado com sucesso!');
              }}>Executar Liquidação</button>
            </div>
          </div>

        </section>
      )}
    </div>
  );
}