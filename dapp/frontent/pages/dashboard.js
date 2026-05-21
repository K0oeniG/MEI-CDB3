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
const DEX_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const NFT_MARKET_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";


export default function Dashboard() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('dex');
  
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
    try {
      const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
      const tx = await contract.mintNFT(nftUri);
      await tx.wait();
      
      await fetch('http://localhost:3001/api/nfts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator: account, tokenUri: nftUri })
      });
      alert('NFT cunhado (minted) com sucesso!');
    } catch (err) { alert(err.message); }
  };

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

  const inputStyle = { display: 'block', marginBottom: '0.75rem', padding: '0.6rem', background: '#0a0a14', border: '1px solid #444', borderRadius: '6px', color: '#fff', width: '90%' };
  const cardStyle = { padding: '1.25rem', border: '1px solid #2a2a3a', borderRadius: '10px', width: '50%', background: '#141423' };
  const btnStyle = { padding: '0.6rem 1.2rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };

  const calculateInstallment = (loan) => {
    // Cálculo: (Amount * Interest) / (100 * Deadline)
    return loan.amount.mul(loan.interest).div(100 * loan.deadline);
  };

  const calculateFinalPayment = (loan) => {
    // Última prestação = Valor da prestação + Capital (Amount)
    return calculateInstallment(loan).add(loan.amount);
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', margin: '2rem 0 1.5rem 0' }}>
          <button onClick={() => setActiveTab('dex')} style={{ padding: '0.75rem 1.25rem', border: 'none', background: activeTab === 'dex' ? '#2e2a52' : '#141323', color: '#fff', cursor: 'pointer', borderRadius: '6px' }}>💰 DEX Market & Loans</button>
          <button onClick={() => setActiveTab('nft-market')} style={{ padding: '0.75rem 1.25rem', border: 'none', background: activeTab === 'nft-market' ? '#2e2a52' : '#141323', color: '#fff', cursor: 'pointer', borderRadius: '6px' }}>🖼️ NFT Marketplace & Auctions</button>
          <button onClick={() => setActiveTab('p2p-pawn')} style={{ padding: '0.75rem 1.25rem', border: 'none', background: activeTab === 'p2p-pawn' ? '#2e2a52' : '#141323', color: '#fff', cursor: 'pointer', borderRadius: '6px' }}>🤝 Peer-to-Peer NFT Loans</button>
        </div>

        {/* ----------------- SECTOR 1: DEX & STANDARD LOANS ----------------- */}
        {activeTab === 'dex' && (
          <section>
            {/* CAIXA DOS EMPRÉSTIMOS DEX SEMPRE VISÍVEL */}
            <div style={{ background: '#1e1b4b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #4338ca' }}>
              <h3 style={{ color: '#818cf8', marginTop: 0 }}>📋 Os Meus Empréstimos Ativos (DEX)</h3>
              {myDexLoans.map(loan => {
  const isLast = loan.paymentsMade.add(1).eq(loan.deadline);
  const paymentValue = isLast ? calculateFinalPayment(loan) : calculateInstallment(loan);
  
  return (
    <div key={loan.id} style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', border: '1px solid #334155' }}>
      <b style={{ color: '#fff' }}>ID: {loan.id}</b>
      <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
        Capital Inicial: {ethers.utils.formatEther(loan.amount)} ETH
      </p>
      <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
        Prestações: {loan.paymentsMade.toString()} / {loan.deadline.toString()}
      </p>
      
      {/* AQUI ESTÁ A NOVIDADE: */}
      <div style={{ marginTop: '10px', padding: '8px', background: '#1e293b', borderRadius: '4px' }}>
        <small style={{ color: '#94a3b8' }}>
          {isLast ? "💰 Valor p/ pagamento final:" : "📅 Valor p/ prestação atual:"}
        </small>
        <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>
          {ethers.utils.formatEther(paymentValue)} ETH
        </div>
      </div>
    </div>
  );
})}
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
            <h3 style={{ color: '#a855f7' }}>3) NFT Base Forge (Mint / Burn)</h3>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={cardStyle}>
                <h4>Forge Digital Collectible (Mint)</h4>
                <input style={inputStyle} placeholder="Metadata String / URI Content" onChange={e => setNftUri(e.target.value)} />
                <button style={{ ...btnStyle, background: '#8b5cf6' }} onClick={handleMintNft}>Forge Asset</button>
              </div>
              <div style={cardStyle}>
                <h4>Destroy Collectible (Burn)</h4>
                <input style={inputStyle} placeholder="Token ID para incinerar" onChange={e => setBurnTokenId(e.target.value)} />
                <button style={{ ...btnStyle, background: '#b91c1c' }} onClick={handleBurnNft}>Incinerar NFT</button>
              </div>
            </div>

            <h3 style={{ color: '#a855f7' }}>3) NFT Direct Market Sales</h3>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={cardStyle}>
                <h4>List Asset For Fixed Sale</h4>
                <input style={inputStyle} placeholder="Token ID" onChange={e => setListTokenId(e.target.value)} />
                <input style={inputStyle} placeholder="Preço Alvo Demandado" onChange={e => setListPrice(e.target.value)} />
                <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={isDexPayment} onChange={e => setIsDexPayment(e.target.checked)} /> Exigir Liquidação em DEX
                </label>
                <button style={{ ...btnStyle, background: '#10b981' }} onClick={async () => {
                  const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                  await (await contract.approve(NFT_MARKET_ADDRESS, listTokenId)).wait();
                  await (await contract.listNFT(listTokenId, ethers.utils.parseEther(listPrice), isDexPayment)).wait();
                  alert('NFT listado para venda direta.');
                }}>Publicar Item</button>
              </div>
              <div style={cardStyle}>
                <h4>Acquire Listed NFT (Buy Direct)</h4>
                <input style={inputStyle} placeholder="Token ID pretendido" onChange={e => setBuyTokenId(e.target.value)} />
                <button style={{ ...btnStyle, background: '#2563eb' }} onClick={handleBuyNft}>Adquirir Asset</button>
              </div>
            </div>

            <h3 style={{ color: '#a855f7' }}>4) NFT Auctions Portal (Open-Bidding)</h3>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={cardStyle}>
                <h4>Inaugurar Leilão Ativo</h4>
                <input style={inputStyle} placeholder="Token ID" onChange={e => setAuctionTokenId(e.target.value)} />
                <input style={inputStyle} placeholder="Preço Mínimo Inicial (ETH)" onChange={e => setAuctionMinPrice(e.target.value)} />
                <input style={inputStyle} placeholder="Duração Total (Segundos)" onChange={e => setAuctionDuration(e.target.value)} />
                <button style={{ ...btnStyle, background: '#d946ef' }} onClick={async () => {
                  const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                  await (await contract.approve(NFT_MARKET_ADDRESS, auctionTokenId)).wait();
                  await (await contract.startAuction(auctionTokenId, ethers.utils.parseEther(auctionMinPrice), auctionDuration)).wait();
                  alert('Leilão aberto para licitações!');
                }}>Abrir Leilão</button>
              </div>
              <div style={cardStyle}>
                <h4>Colocar Licitacão (Bid) & Fecho</h4>
                <input style={inputStyle} placeholder="Token ID do Leilão" onChange={e => setBidTokenId(e.target.value)} />
                <input style={inputStyle} placeholder="Montante da Licitação (ETH)" onChange={e => setBidAmount(e.target.value)} />
                <button style={{ ...btnStyle, background: '#3b82f6', marginBottom: '1rem', display: 'block' }} onClick={async () => {
                  const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                  await (await contract.placeBid(bidTokenId, { value: ethers.utils.parseEther(bidAmount) })).wait();
                  alert('Licitação registada!');
                }}>Submeter Licitacão</button>
                
                <input style={inputStyle} placeholder="Token ID para encerrar" onChange={e => setEndAuctionTokenId(e.target.value)} />
                <button style={{ ...btnStyle, background: '#4b5563' }} onClick={handleEndAuction}>Finalizar Leilão Expirado</button>
              </div>
            </div>
          </section>
        )}

        {/* ----------------- SECTOR 3: PEER-TO-PEER PAWNING ----------------- */}
        {activeTab === 'p2p-pawn' && (
          <section>
            {/* CAIXA DOS EMPRÉSTIMOS P2P SEMPRE VISÍVEL */}
            <div style={{ background: '#064e3b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #059669' }}>
              <h3 style={{ color: '#34d399', marginTop: 0 }}>📋 Os Meus Pedidos P2P (NFT Collateral)</h3>
              {myP2pLoans.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {myP2pLoans.map(loan => (
                    <div key={loan.id} style={{ background: '#022c22', padding: '1rem', borderRadius: '6px', border: '1px solid #065f46' }}>
                      <b style={{ color: '#fff' }}>Loan ID: {loan.id}</b>
                      <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#d1fae5' }}>Token ID Bloqueado: {loan.tokenId.toString()}</p>
                      <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#d1fae5' }}>Dívida (ETH): {ethers.utils.formatEther(loan.ethRequested)} ETH</p>
                      <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#d1fae5' }}>
                        Estado: {loan.active ? (loan.funded ? "🟢 Financiado" : "🟠 A aguardar Provedor") : "🔴 Fechado/Liquidado"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#a7f3d0', fontSize: '0.9rem', margin: 0 }}>Não tens pedidos P2P ativos neste momento.</p>
              )}
            </div>

            <h3 style={{ color: '#10b981' }}>5) NFT Liquidity Matching Engine</h3>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={cardStyle}>
                <h4>1. Solicitar Financiamento (Mutuário)</h4>
                <input style={inputStyle} placeholder="Token ID (Lock in Escrow)" onChange={e => setListTokenId(e.target.value)} />
                <input style={inputStyle} placeholder="ETH Capital Requisitado" onChange={e => setP2pEthRequest(e.target.value)} />
                <input style={inputStyle} placeholder="Prazo Limite (Segundos)" onChange={e => setLoanDeadline(e.target.value)} />
                <button style={{ ...btnStyle, background: '#8b5cf6' }} onClick={async () => {
                  const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                  await (await contract.approve(NFT_MARKET_ADDRESS, listTokenId)).wait();
                  await (await contract.requestNftLoan(listTokenId, ethers.utils.parseEther(p2pEthRequest), loanDeadline)).wait();
                  alert('Pedido de empréstimo registado na Blockchain!');
                  fetchMyLoans(account, signer);
                }}>Registrar Pedido</button>
              </div>
              
              <div style={cardStyle}>
                <h4>2. Conceder Financiamento (Provedor)</h4>
                <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>Requer caução em tokens DEX proporcional ao valor do Ether cedido.</p>
                <input style={inputStyle} placeholder="Active Loan ID" onChange={e => setP2pLoanId(e.target.value)} />
                <button style={{ ...btnStyle, background: '#10b981' }} onClick={async () => {
                  const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                  const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
                  const loanData = await contract.nftLoans(p2pLoanId);
                  await (await dexContract.approve(NFT_MARKET_ADDRESS, loanData.dexRequired)).wait();
                  await (await contract.fundNftLoan(p2pLoanId)).wait();
                  alert('Crédito concedido e liquidez enviada!');
                  updateDexBalance();
                }}>Apoiar com DEX</button>
              </div>
            </div>

            <h3 style={{ color: '#10b981' }}>5) Clientes & Fechos de Operações P2P</h3>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={cardStyle}>
                <h4>Liquidar e Resgatar NFT (Mutuário)</h4>
                <input style={inputStyle} placeholder="Loan ID" onChange={e => setRepayLoanId(e.target.value)} />
                <input style={inputStyle} placeholder="ETH Total Due (Capital + 10% Juros)" onChange={e => setRepayAmount(e.target.value)} />
                <button style={{ ...btnStyle, background: '#2563eb' }} onClick={async () => {
                  const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                  await (await contract.repayNftLoan(repayLoanId, { value: ethers.utils.parseEther(repayAmount) })).wait();
                  alert('Empréstimo saldado e NFT recuperado com sucesso!');
                  updateDexBalance();
                  fetchMyLoans(account, signer);
                }}>Pagar e Recuperar</button>
              </div>
              
              <div style={cardStyle}>
                <h4>Executar Colateral Expirado (Provedor)</h4>
                <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>Confisca o NFT do devedor se o prazo final de maturação falhar.</p>
                <input style={inputStyle} placeholder="Loan ID em Falha" onChange={e => setLiquidateLoanId(e.target.value)} />
                <button style={{ ...btnStyle, background: '#ef4444' }} onClick={async () => {
                  const contract = new ethers.Contract(NFT_MARKET_ADDRESS, NFT_MARKET_ABI, signer);
                  await (await contract.liquidateNftLoan(liquidateLoanId)).wait();
                  alert('Liquidação executada! NFT transferido para a sua carteira.');
                }}>Forçar Execução</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}