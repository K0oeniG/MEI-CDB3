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
      "stateMutability": "payable",
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
      ],
      "name": "transferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
const DEX_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const NFT_MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";


export default function Dashboard() {

    const [isP2pMarketOpen, setIsP2pMarketOpen] = useState(false);
const [isP2pInvestmentsOpen, setIsP2pInvestmentsOpen] = useState(false);
const [isP2pMyLoansOpen, setIsP2pMyLoansOpen] = useState(false);
    const [bidHistory, setBidHistory] = useState([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false); // Começa fechado por defeito
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
const [p2pTab, setP2pTab] = useState('market'); // 'market', 'borrower', ou 'lender'
const [allP2pLoans, setAllP2pLoans] = useState([]);
  
  // Informação de Sessão Off-Chain e Blockchain
  const [sessionUser, setSessionUser] = useState(null);
  const [dexBalance, setDexBalance] = useState('0');

  // Form/UI States DEX
  const [dexAmount, setDexAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [loanCollateral, setLoanCollateral] = useState('');
  const [loanDeadline, setLoanDeadline] = useState('');
  const [paymentLoanId, setPaymentLoanId] = useState('');
  const [paymentValue, setPaymentValue] = useState('');
  
  // Form/UI States NFT Marketplace
  const [nftUri, setNftUri] = useState('');
  const [listTokenId, setListTokenId] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [isDexPayment, setIsDexPayment] = useState(false);
  const [buyTokenId, setBuyTokenId] = useState('');
  const [burnTokenId, setBurnTokenId] = useState('');
  
  // Form/UI States NFT Auctions
  const [auctionTokenId, setAuctionTokenId] = useState('');
  const [auctionMinPrice, setAuctionMinPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('');
  const [bidTokenId, setBidTokenId] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [endAuctionTokenId, setEndAuctionTokenId] = useState('');

  // Form/UI States P2P Loans
  const [p2pLoanId, setP2pLoanId] = useState('');
  const [p2pEthRequest, setP2pEthRequest] = useState('');
  const [repayLoanId, setRepayLoanId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [liquidateLoanId, setLiquidateLoanId] = useState('');

  // --- NOVOS STATES PARA GUARDAR OS EMPRÉSTIMOS ---
  const [myDexLoans, setMyDexLoans] = useState([]);
  const [myP2pLoans, setMyP2pLoans] = useState([]);

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(prov);
    }
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) setSessionUser(JSON.parse(cachedUser));
  }, []);

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
      // addr é o endereço da carteira que queres consultar
      const bal = await contract.balanceOf(addr); 
      setDexBalance(ethers.utils.formatEther(bal));
    } catch(e) { console.error("Erro no saldo:", e); }
  };

const fetchMyLoans = async (userAddress, sig) => {
    const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, sig || signer);
    const foundDex = [];

    // O teu _nextLoanId começa em 1, logo os teus empréstimos vão de 1 até (_nextLoanId - 1)
    // Para simplificar, vamos ler apenas os primeiros 10 IDs criados
    for (let i = 1; i <= 10; i++) { 
      try {
        const loan = await dexContract.loans(i);
        // Só adiciona se o borrower for o user atual e o valor for > 0
        if (loan.borrower.toLowerCase() === userAddress.toLowerCase() && loan.amount.gt(0)) {
          foundDex.push({ id: i, ...loan });
        }
      } catch (e) {
        // Se der erro, este ID não existe, ignoramos e continuamos
        continue;
      }
    }
    setMyDexLoans(foundDex);
  };

  const handleBuyDex = async () => {
    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.buyDex({ value: ethers.utils.parseEther(ethAmount) });
      await tx.wait();
      alert('Tokens DEX adquiridos!');
      updateDexBalance();
    } catch (err) { alert(err.message); }
  };

  const handleSellDex = async () => {
    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.sellDex(ethers.utils.parseEther(dexAmount));
      await tx.wait();
      alert('Tokens DEX vendidos!');
      updateDexBalance();
    } catch (err) { alert(err.message); }
  };

  const handleTakeLoan = async () => {
    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.loan(ethers.utils.parseEther(loanCollateral), loanDeadline);
      await tx.wait();
      alert('Contrato de Empréstimo Iniciado com sucesso!');
      updateDexBalance();
      fetchMyLoans(account, signer); // Atualiza a lista automaticamente
    } catch (err) { alert(err.message); }
  };

  const handleMakePayment = async () => {
    try {
      const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
      const tx = await contract.makePayment(paymentLoanId, { value: ethers.utils.parseEther(paymentValue) });
      await tx.wait();
      alert('Pagamento da prestação processado!');
      fetchMyLoans(account, signer); // Atualiza a lista automaticamente
    } catch (err) { alert(err.message); }
  };

  const handleMintNft = async () => {
  if (!nftFile) return alert('Por favor, seleciona uma imagem primeiro!');
  
  try {
    // 1. Prepara a imagem para enviar para o backend
    const formData = new FormData();
    formData.append('nftImage', nftFile); // O nome tem de bater certo com o upload.single('nftImage')

    // 2. Envia para o backend
    const uploadRes = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const uploadData = await uploadRes.json();
    if (!uploadData.imageUrl) throw new Error("Falha no upload da imagem");
    
    const finalUri = uploadData.imageUrl; // Link gerado: http://localhost:3001/uploads/12345.png

    // 3. Forja o NFT na Blockchain com o Link
    const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
    const tx = await contract.mintNFT(finalUri);
    await tx.wait();
    
    // 4. Guarda na Base de Dados (opcional, como já tinhas)
    await fetch('http://localhost:3001/api/nfts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator: account, tokenUri: finalUri })
    });

    alert(`NFT forjado com sucesso!\nA tua arte está guardada em: ${finalUri}`);
    setNftFile(null); // Limpa o formulário
  } catch (err) { alert(err.message); }
};

const fetchMarketData = async (userAddress, sig) => {
    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, sig || signer);
      const vendas = [];
      const leiloes = [];
      const foundAllP2p = [];
      const meusNfts = []; 

      // Procura nos primeiros 50 NFTs
      for (let i = 1; i <= 50; i++) {
        
        // 1. VERIFICAR A TUA COLEÇÃO (Isolado)
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            const uri = await contract.tokenURI(i);
            meusNfts.push({ tokenId: i, uri });
          }
        } catch (e) { /* Token não existe, passa à frente */ }

        // 2. LER VENDAS DIRETAS (Filtra os que já foram vendidos!)
        try {
          const listing = await contract.listings(i);
          // Adicionámos o listing.sold === false para não mostrar o que já foi comprado!
          if (listing.price && listing.price.gt(0) && listing.sold === false) {
            const uri = await contract.tokenURI(i);
            vendas.push({ tokenId: i, price: listing.price, isDexPayment: listing.isDexPayment, uri });
          }
        } catch (e) { /* Erro a ler venda, ignora */ }

        // 3. LER LEILÕES
       
        try {
          const auction = await contract.auctions(i);
          if (auction.minPrice && auction.minPrice.gt(0) && auction.active === true) {
            const uri = await contract.tokenURI(i);
            leiloes.push({ 
              tokenId: i, 
              minPrice: auction.minPrice, 
              endTime: auction.endTime,
              highestBid: auction.highestBid, 
              seller: auction.seller,      
              highestBidder: auction.highestBidder,
              uri 
            });
          }
        } catch (e) {}

        // 4. LER P2P
        try {
          const p2p = await contract.nftLoans(i);
          if (p2p.ethRequested && p2p.ethRequested.gt(0)) {
            let uri = "";
            try { uri = await contract.tokenURI(p2p.tokenId); } catch(err) {}
            foundAllP2p.push({ id: i, uri, ...p2p });
          }
        } catch (e) { /* Erro a ler P2P, ignora */ }
        
      } // fim do loop
      
      setMarketListings(vendas);
      setActiveAuctions(leiloes);
      setAllP2pLoans(foundAllP2p);
      setMyNfts(meusNfts); 
    } catch (err) { console.error("Erro geral a ler mercado:", err); }
  };


  

// RELÓGIO AO VIVO E HISTÓRICO DE EVENTOS PARA O LEILÃO
  useEffect(() => {
    if (!selectedAuction) return;

    // 1. LER O HISTÓRICO DE LICITAÇÕES NA BLOCKCHAIN
    const fetchHistory = async () => {
      try {
        const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
        // Filtra apenas os eventos 'BidPlaced' deste Token ID específico
        const filter = contract.filters.BidPlaced(selectedAuction.tokenId);
        const events = await contract.queryFilter(filter);
        
        // Mapeia e inverte a ordem para o mais recente ficar no topo
        const history = events.map(e => ({
          bidder: e.args.bidder,
          amount: e.args.amount
        })).reverse(); 
        
        setBidHistory(history);
      } catch (err) { console.error("Erro ao ler histórico:", err); }
    };
    fetchHistory();

    // 2. O RELÓGIO (CONTADOR)
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const end = selectedAuction.endTime.toNumber(); // Lê o endTime do estado atual
      
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
  }, [selectedAuction, signer]);

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
      updateDexBalance();
    } catch (err) { alert(err.message); }
  };

  const handleBurnNft = async () => {
    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      await (await contract.burnNFT(burnTokenId)).wait();
      alert('NFT permanentemente destruído (burned).');
    } catch (err) { alert(err.message); }
  };

  const handleEndAuction = async () => {
    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      await (await contract.endAuction(endAuctionTokenId)).wait();
      alert('Leilão finalizado e ativos distribuídos!');
    } catch (err) { alert(err.message); }
  };

  const inputStyle = { display: 'block', marginBottom: '0.75rem', padding: '0.6rem', background: '#0a0a14', border: '1px solid #444', borderRadius: '6px', color: '#fff', width: '100%', boxSizing: 'border-box' };
  
  const cardStyle = { padding: '1.25rem', border: '1px solid #2a2a3a', borderRadius: '10px', background: '#141423', width: '100%', boxSizing: 'border-box' };
  
  const btnStyle = { padding: '0.6rem 1.2rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' };
  const calculateInstallment = (loan) => {
    // Cálculo: (Amount * Interest) / (100 * Deadline)
    return loan.amount.mul(loan.interest).div(100 * loan.deadline);
  };

  const calculateFinalPayment = (loan) => {
    // Última prestação = Valor da prestação + Capital (Amount)
    return calculateInstallment(loan).add(loan.amount);
  };

  const handleTerminateLoan = async () => {
  try {
    const contract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
    const loan = await contract.loans(paymentLoanId); // Lê os dados
    
    // Calcula: Amount + Termination Fee
    const totalToPay = loan.amount.add(loan.termination); 
    
    // Executa o término
    const tx = await contract.terminateLoan(paymentLoanId, { value: totalToPay });
    await tx.wait();
    
    alert('Empréstimo encerrado antecipadamente com sucesso!');
    fetchMyLoans(account, signer);
  } catch (err) { alert(err.message); }
};


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
          <div>
            <h1 style={{ margin: 0, fontWeight: '800', background: 'linear-gradient(90deg, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NEXUS FINANCIAL PROTOCOL</h1>
            {sessionUser && <small style={{ color: '#aaa' }}>Autenticado como: <b style={{ color: '#a855f7' }}>{sessionUser.username}</b></small>}
          </div>
          <button onClick={connectWallet} style={{ ...btnStyle, background: account ? '#10b981' : '#6366f1' }}>
            {account ? `Connected: ${account.substring(0,6)}...` : '🦊 Connect Wallet'}
          </button>
        </div>

        {account && (
           <div style={{ background: 'linear-gradient(90deg, #1d1b3c, #0c0b1d)', padding: '1rem', borderRadius: '8px', margin: '1.5rem 0', border: '1px solid #4c3799', display: 'flex', justifyContent: 'space-between' }}>
             <span style={{ fontWeight: 'bold', color: '#c084fc' }}>📊 Carteira Sincronizada Ativa</span>
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

            <h3 style={{ color: '#6366f1' }}>1) DEX Market Exchange</h3>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={cardStyle}>
                <h4>Buy DEX Tokens</h4>
                <input style={inputStyle} placeholder="ETH a Enviar" onChange={e => setEthAmount(e.target.value)} />
                <button style={{ ...btnStyle, background: '#3b82f6' }} onClick={handleBuyDex}>Execute Buy</button>
              </div>
              <div style={cardStyle}>
                <h4>Sell DEX Tokens</h4>
                <input style={inputStyle} placeholder="DEX a Vender" onChange={e => setDexAmount(e.target.value)} />
                <button style={{ ...btnStyle, background: '#ef4444' }} onClick={handleSellDex}>Execute Sell</button>
              </div>
            </div>
            
            <h3 style={{ color: '#6366f1' }}>2) Standard Collateralized Lending Pool</h3>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={cardStyle}>
                <h4>Request Liquidity (Lock DEX)</h4>
                <input style={inputStyle} placeholder="Quantidade DEX Colateral" onChange={e => setLoanCollateral(e.target.value)} />
                <input style={inputStyle} placeholder="Duração em Ciclos (Ex: 3)" onChange={e => setLoanDeadline(e.target.value)} />
                <button style={{ ...btnStyle, background: '#10b981' }} onClick={handleTakeLoan}>Process Loan</button>
                <button style={{ ...btnStyle, background: '#ef4444', marginLeft: '10px' }} onClick={handleTerminateLoan}>
  Encerrar Totalmente
</button>
              </div>

              <div style={cardStyle}>
                <h4>Repay Installment / Early Close</h4>
                <input style={inputStyle} placeholder="ID do Empréstimo" onChange={e => setPaymentLoanId(e.target.value)} />
                <input style={inputStyle} placeholder="ETH a Enviar para Amortizar" onChange={e => setPaymentValue(e.target.value)} />
                <button style={{ ...btnStyle, background: '#f59e0b' }} onClick={handleMakePayment}>Submit Payment</button>
              </div>
            </div>
          </section>
        )}

      {/* ----------------- SECTOR 2: NFT MARKETPLACE & AUCTIONS ----------------- */}
        {activeTab === 'nft-market' && (
          <section>
            
            {/* BOTÃO GLOBAL DE ATUALIZAÇÃO */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button style={{ ...btnStyle, background: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => fetchMarketData(account, signer)}>
                🔄 Atualizar Mercado
              </button>
            </div>

            {/* ====== SE UM LEILÃO ESTIVER SELECIONADO (SALA DE LEILÃO) ====== */}
            {selectedAuction ? (
              <div style={{ background: '#1e1b4b', padding: '2rem', borderRadius: '12px', border: '1px solid #c026d3', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                
                {/* Lado Esquerdo: Imagem Gigante */}
                <div style={{ flex: '1' }}>
                  <button 
                    style={{ ...btnStyle, background: '#4b5563', marginBottom: '1rem' }} 
                    onClick={() => setSelectedAuction(null)}
                  >
                    ⬅ Voltar às Galerias
                  </button>
                  <img src={selectedAuction.uri} alt="NFT Leilão" style={{ width: '100%', borderRadius: '10px', border: '2px solid #a855f7' }} />
                </div>

                {/* Lado Direito: Detalhes, Relógio e Licitação */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '3rem' }}>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '2rem' }}>Leilão do Token #{selectedAuction.tokenId}</h2>
                  
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
                      {/* O AVISO DE LIDERANÇA */}
                      {selectedAuction.highestBidder && selectedAuction.highestBidder.toLowerCase() === account.toLowerCase() && (
                        <div style={{ background: '#059669', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', marginTop: '5px', fontWeight: 'bold' }}>
                          👑 És o líder atual!
                        </div>
                      )}
                    </div>

                    
                  </div>

{/* ====== NOVO: HISTÓRICO DE LICITAÇÕES ====== */}
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
                 {/* CAIXA DE LICITAÇÃO OU BOTÃO DE FINALIZAR (DINÂMICO) */}
                  <div style={{ marginTop: '1rem' }}>
                    {timeLeft.includes('Terminado') ? (
                      
                      // SE O LEILÃO JÁ TERMINOU: Mostra o botão de fecho e resgate
                      <button 
                        style={{ ...btnStyle, background: '#eab308', color: '#000', width: '100%', fontSize: '1.2rem', padding: '1rem' }} 
                        onClick={async () => {
                          try {
                            const c = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                            // Chama a função do teu contrato Solidity!
                            await (await c.endAuction(selectedAuction.tokenId)).wait();
                            
                            alert('🏆 Leilão finalizado com sucesso! O NFT foi enviado para a tua galeria.');
                            setSelectedAuction(null); // Volta para as galerias
                            fetchMarketData(account, signer); // Atualiza os teus NFTs e a montra
                          } catch(e) { alert(e.message); }
                        }}
                      >
                        🏆 Finalizar Leilão e Reclamar NFT
                      </button>

                    ) : (

                      // SE O LEILÃO AINDA DECORRE: Mostra a caixa normal de licitação
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
              /* ====== SE NÃO HOUVER LEILÃO SELECIONADO (MOSTRA AS GALERIAS NORMAIS) ====== */
              <>
                {/* 1. A MINHA COLEÇÃO PESSOAL (COLAPSÁVEL) */}
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: '#131129', padding: '1rem', borderRadius: '10px', border: '1px solid #3b2d6b' }}>
                      {myNfts.length > 0 ? myNfts.map(nft => (
                        <div key={nft.tokenId} style={{ background: '#0b0a12', padding: '0.75rem', borderRadius: '8px', border: '1px solid #4c3799', width: '160px', textAlign: 'center' }}>
                          <img src={nft.uri} alt={`NFT ${nft.tokenId}`} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px', backgroundColor: '#000' }} />
                          <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>ID do Token: <span style={{color: '#a855f7'}}>{nft.tokenId}</span></span>
                        </div>
                      )) : (
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '10px' }}>Ainda não possuis nenhum NFT nesta carteira. Cria um no formulário abaixo!</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. MONTRA DE VENDAS DIRETAS (COLAPSÁVEL) */}
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {marketListings.length > 0 ? marketListings.map(item => (
                        <div key={item.tokenId} style={{ background: '#1e1b4b', padding: '1rem', borderRadius: '8px', border: '1px solid #4338ca', width: '220px', textAlign: 'center' }}>
                          <img src={item.uri} alt={`NFT ${item.tokenId}`} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px', backgroundColor: '#000' }} />
                          <b style={{ color: '#fff', display: 'block' }}>Token ID: {item.tokenId}</b>
                          <p style={{ color: '#10b981', fontWeight: 'bold', margin: '10px 0' }}>
                            {ethers.utils.formatEther(item.price)} {item.isDexPayment ? 'DEX' : 'ETH'}
                          </p>
                          <button style={{ ...btnStyle, background: '#2563eb', width: '100%' }} onClick={async () => {
                            try {
                              const c = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                              if(item.isDexPayment){
                                 const dex = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
                                 await (await dex.approve(NFT_MARKET_ADDRESS, item.price)).wait();
                              }
                              await (await c.buyNFT(item.tokenId, { value: item.isDexPayment ? 0 : item.price })).wait();
                              alert('Comprado com sucesso!');
                              fetchMarketData(account, signer);
                            } catch(e) { alert(e.message); }
                          }}>Adquirir Asset</button>
                        </div>
                      )) : <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Não há NFTs listados para venda direta.</p>}
                    </div>
                  )}
                </div>

                {/* 3. MONTRA DE LEILÕES (CLICÁVEL & COLAPSÁVEL) */}
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

            {/* MANTER AS CAIXAS DE ADMINISTRAÇÃO (Mint, List, Open Auction) */}
            <h3 style={{ color: '#a855f7', borderTop: '1px solid #333', paddingTop: '2rem' }}>⚙️ Ferramentas de Criador & Vendedor</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem', width: '100%' }}>
              <div style={cardStyle}>
                <h4>Forge Digital Collectible (Mint)</h4>
                <input type="file" accept="image/*" style={{ ...inputStyle, background: '#1e1e2d', cursor: 'pointer' }} onChange={e => setNftFile(e.target.files[0])} />
                <button style={{ ...btnStyle, background: '#8b5cf6', width: '100%' }} onClick={handleMintNft}>Forge Asset</button>
              </div>
              
              <div style={cardStyle}>
                <h4>List Asset For Fixed Sale</h4>
                <input style={inputStyle} placeholder="Token ID" onChange={e => setListTokenId(e.target.value)} />
                <input style={inputStyle} placeholder="Preço (ETH ou DEX)" onChange={e => setListPrice(e.target.value)} />
                <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.9rem', color: '#fff' }}>
                  <input type="checkbox" checked={isDexPayment} onChange={e => setIsDexPayment(e.target.checked)} /> Exigir DEX
                </label>
                <button style={{ ...btnStyle, background: '#10b981', width: '100%' }} onClick={async () => {
                  const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                  await (await contract.approve(NFT_MARKET_ADDRESS, listTokenId)).wait();
                  await (await contract.listNFT(listTokenId, ethers.utils.parseEther(listPrice), isDexPayment)).wait();
                  alert('Listado com sucesso!');
                  fetchMarketData(account, signer);
                }}>Publicar Venda</button>
              </div>

              <div style={cardStyle}>
                <h4>Inaugurar Leilão</h4>
                <input style={inputStyle} placeholder="Token ID" onChange={e => setAuctionTokenId(e.target.value)} />
                <input style={inputStyle} placeholder="Preço Base (ETH)" onChange={e => setAuctionMinPrice(e.target.value)} />
                <input style={inputStyle} placeholder="Segundos" onChange={e => setAuctionDuration(e.target.value)} />
                <button style={{ ...btnStyle, background: '#d946ef', width: '100%' }} onClick={async () => {
                  const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                  await (await contract.approve(NFT_MARKET_ADDRESS, auctionTokenId)).wait();
                  await (await contract.startAuction(auctionTokenId, ethers.utils.parseEther(auctionMinPrice), auctionDuration)).wait();
                  alert('Leilão aberto!');
                  fetchMarketData(account, signer);
                }}>Abrir Leilão</button>
              </div>
            </div>
          </section>
        )}



       {/* ----------------- SECTOR 3: PEER-TO-PEER PAWNING ----------------- */}
        {activeTab === 'p2p-pawn' && (
          <section>
            
            {/* BOTÃO GLOBAL DE ATUALIZAÇÃO */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button style={{ ...btnStyle, background: '#064e3b', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => fetchMarketData(account, signer)}>
                🔄 Atualizar P2P
              </button>
            </div>

            {/* 1. MERCADO P2P (COLAPSÁVEL) */}
            <div style={{ marginBottom: '2.5rem', width: '100%' }}>
              <div onClick={() => setIsP2pMarketOpen(!isP2pMarketOpen)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <h3 style={{ color: '#34d399', margin: 0, userSelect: 'none' }}>{isP2pMarketOpen ? '▼' : '▶'} 🏦 Mercado P2P (Apoiar Projetos)</h3>
              </div>
              <p style={{ color: '#a7f3d0', marginTop: 0, marginBottom: '1rem', fontSize: '0.9rem' }}>Projetos da comunidade a aguardar liquidez. Fornece ETH e retém DEX como garantia.</p>
              
              {isP2pMarketOpen && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                  {allP2pLoans.filter(l => l.active && !l.funded && l.borrower.toLowerCase() !== account.toLowerCase()).map(loan => (
                    <div key={loan.id} style={{ background: '#022c22', padding: '1rem', borderRadius: '8px', border: '1px solid #059669', width: '240px', textAlign: 'center' }}>
                      {loan.uri && <img src={loan.uri} alt="NFT Colateral" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />}
                      <b style={{ color: '#fff', display: 'block' }}>Loan ID: {loan.id.toString()}</b>
                      <p style={{ color: '#d1fae5', margin: '10px 0' }}>Requisitado: <b style={{color: '#fbbf24'}}>{ethers.utils.formatEther(loan.ethRequested)} ETH</b></p>
                      
                      <button style={{ ...btnStyle, background: '#10b981', width: '100%' }} onClick={async () => {
                        try {
                          const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                          const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
                          await (await dexContract.approve(NFT_MARKET_ADDRESS, loan.dexRequired)).wait();
                          await (await contract.fundNftLoan(loan.id, { value: loan.ethRequested })).wait();
                          alert('Crédito concedido!');
                          fetchMarketData(account, signer);
                        } catch(e) { alert(e.message); }
                      }}>Apoiar com Liquidez</button>
                    </div>
                  ))}
                  {allP2pLoans.filter(l => l.active && !l.funded && l.borrower.toLowerCase() !== account.toLowerCase()).length === 0 && <p style={{ color: '#aaa' }}>Não há pedidos ativos no mercado.</p>}
                </div>
              )}
            </div>

            {/* 2. OS MEUS INVESTIMENTOS (COLAPSÁVEL) */}
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
                          
                          // VERIFICAÇÃO INTELIGENTE DE TEMPO NO FRONTEND
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

            {/* 3. OS MEUS PEDIDOS ATIVOS (COLAPSÁVEL) */}
            <div style={{ marginBottom: '2.5rem', width: '100%' }}>
              <div onClick={() => setIsP2pMyLoansOpen(!isP2pMyLoansOpen)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <h3 style={{ color: '#3b82f6', margin: 0, userSelect: 'none' }}>{isP2pMyLoansOpen ? '▼' : '▶'} 📥 Os Meus Pedidos (Estado & Pagamento)</h3>
              </div>
              
              {isP2pMyLoansOpen && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                  {allP2pLoans.filter(l => l.borrower.toLowerCase() === account.toLowerCase()).map(loan => {
                    
                    // CÁLCULO PRECISO AQUI EM CIMA: Capital + 10% Juros
                    const totalDueBN = loan.ethRequested.mul(110).div(100);
                    const totalDueEth = ethers.utils.formatEther(totalDueBN);

                    return (
                      <div key={loan.id} style={{ background: '#1e3a8a', padding: '1rem', borderRadius: '8px', border: '1px solid #3b82f6', width: '240px', textAlign: 'center' }}>
                        {loan.uri && <img src={loan.uri} alt="NFT" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />}
                        <b style={{ color: '#fff', display: 'block' }}>Loan ID: {loan.id.toString()}</b>
                        
                        <p style={{ margin: '10px 0', fontSize: '0.85rem', color: loan.funded ? '#34d399' : '#fcd34d', fontWeight: 'bold' }}>
                          Estado: {loan.active ? (loan.funded ? "🟢 Financiado" : "🟠 A aguardar") : "🔴 Encerrado"}
                        </p>
                        
                        {/* SE ESTIVER FINANCIADO: MOSTRA A ÁREA DE PAGAMENTO COM O VALOR */}
                        {loan.active && loan.funded && (
                          <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px', marginTop: '10px', border: '1px solid #1e293b' }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 5px 0' }}>Total a Liquidar (C/ Juros):</p>
                            <p style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>{totalDueEth} ETH</p>
                            
                            <button style={{ ...btnStyle, background: '#2563eb', width: '100%' }} onClick={async () => {
                               try {
                                 const c = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                                 // Envia a transação com o valor já calculado
                                 await (await c.repayNftLoan(loan.id, { value: totalDueBN })).wait();
                                 alert('✅ Dívida saldada com sucesso! O teu NFT voltou para a tua carteira.');
                                 fetchMarketData(account, signer);
                               } catch(e) { alert(e.message); }
                            }}>Pagar e Recuperar NFT</button>
                          </div>
                        )}

                        {/* SE AINDA ESTIVER A AGUARDAR: MOSTRA APENAS O VALOR PEDIDO */}
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

            {/* 4. FERRAMENTAS DE FINANCIAMENTO (NOVO FORMATO "CARD") */}
            <h3 style={{ color: '#3b82f6', borderTop: '1px solid #333', paddingTop: '2rem' }}>⚙️ Ferramentas de Mutuário</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 350px))', gap: '1.5rem', marginBottom: '2rem', width: '100%' }}>
              
              <div style={{ ...cardStyle, borderColor: '#3b82f6' }}>
                <h4 style={{ color: '#93c5fd', marginTop: 0 }}>Lançar Pedido de Financiamento</h4>
                <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '1rem' }}>Usa um ID da tua Galeria como colateral.</p>
                
                <input id="newLoanId" style={inputStyle} placeholder="Token ID do NFT (Colateral)" />
                <input id="newLoanEth" style={inputStyle} placeholder="ETH Requisitado" />
                <input id="newLoanTime" style={inputStyle} placeholder="Prazo (Segundos)" />
                
                <button style={{ ...btnStyle, background: '#2563eb', width: '100%', marginTop: '10px' }} onClick={async () => {
                  try {
                    const tId = document.getElementById('newLoanId').value;
                    const eth = document.getElementById('newLoanEth').value;
                    const time = document.getElementById('newLoanTime').value;
                    const c = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                    await (await c.approve(NFT_MARKET_ADDRESS, tId)).wait();
                    await (await c.requestNftLoan(tId, ethers.utils.parseEther(eth), time)).wait();
                    alert('Pedido lançado no mercado!');
                    fetchMarketData(account, signer);
                  } catch(e) { alert(e.message); }
                }}>Solicitar Financiamento</button>
              </div>

            </div>

          </section>
        )}
        
      </div>
    </div>
  );

}