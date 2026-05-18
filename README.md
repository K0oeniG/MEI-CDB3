# MEI-CDB3

## How to Deploy in Remix

Compile both DecentralizedFinance.sol and NFTPawningMarketplace.sol

### Step 1 - Deploy DecentralizedFinance (The DEX)

    Go to the Deploy & Run Transactions tab (the Ethereum logo icon on the left sidebar).

    Ensure your Environment is set to Remix VM (or Injected Provider - MetaMask if testing with your actual extension wallet).

    Select DecentralizedFinance from the Contract dropdown menu.

    Expand the orange Deploy button by clicking the little arrow next to it to show the input fields:

        _dexSwapRate: 1000000000000000 (0.001 ETH)

        _paymentCycle: 180 (3 minutes)

        _interest: 10 (10% juros)

        _terminationFee: 1000000000000000 (0.001 ETH)

        _maxLoanDuration: 5

    Click Deploy.

### Step 2 - Deploy NFTPawningMarketplace (The NFT Market)

    Stay on the same Deploy & Run Transactions tab.

    Change the Contract dropdown selection to NFTPawningMarketplace.

    Look at the input box next to the orange Deploy button. It asks for _dexContractAddress.

    Paste the contract address you just copied from Step 1 into that input field. (REMOVER O 0x)

    Click Transact.

### Step 3 - Linking Your Frontend to Remix

In frontend/pages/index.js and admin.js

Change
const DEX_ADDRESS = "PASTE_YOUR_FIRST_REMIX_ADDRESS_HERE";
const NFT_MARKET_ADDRESS = "PASTE_YOUR_SECOND_REMIX_ADDRESS_HERE";

To the respective address (REMOVE THE Ox)