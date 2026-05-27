
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DecentralizedFinance is ERC20, Ownable, ReentrancyGuard {

    uint256 public dexSwapRate;
    uint256 public maxLoanDuration;

    uint256 public globalPaymentCycle;
    uint256 public globalInterest;
    uint256 public globalTerminationFee;

    uint256 private _nextLoanId;

    struct Loan {
        address borrower;
        uint256 collateral;
        uint256 amount;
        uint256 deadline;
        uint256 paymentCycle;
        uint256 interest;
        uint256 termination;
        uint256 lastPaymentTime;
        uint256 paymentsMade;
        uint256 swapRateSnapshot;
    }

    error ValorIncorreto(uint256 valorEsperado, uint256 valorEnviado);
    mapping(uint256 => Loan) public loans;

    event LoanCreated(address indexed borrower, uint256 loanId, uint256 amount, uint256 deadline);
    event LoanFinished(address indexed borrower, uint256 loanId, uint256 amount);
    event LoanDefaulted(address indexed borrower, uint256 loanId);
   
    event DexSwapRateUpdated(uint256 oldRate, uint256 newRate);
    event GlobalParamsUpdated(uint256 cycle, uint256 interest, uint256 fee, uint256 maxDuration);

    constructor(
        uint256 _dexSwapRate,
        uint256 _paymentCycle,
        uint256 _interest,
        uint256 _terminationFee,
        uint256 _maxLoanDuration
    ) ERC20("DEX", "DEX") Ownable(msg.sender) {
        
        require(_dexSwapRate > 0, "Taxa de swap invalida.");
        require(_paymentCycle > 0, "Ciclo de pagamento invalido.");
        require(_maxLoanDuration > 0, "Duracao maxima invalida.");

        dexSwapRate = _dexSwapRate;
        globalPaymentCycle = _paymentCycle;
        globalInterest = _interest;
        globalTerminationFee = _terminationFee;
        maxLoanDuration = _maxLoanDuration;
        _mint(address(this), 10**18 * (10 ** decimals()));
        _nextLoanId = 1;
    }

    receive() external payable {}

    // ==========================================
    // ADMINISTRATOR CONSOLE FUNCTIONS
    // ==========================================

    function setDexSwapRate(uint256 _newRate) external onlyOwner {
        
        require(_newRate > 0, "Taxa invalida.");
        
        emit DexSwapRateUpdated(dexSwapRate, _newRate);
        dexSwapRate = _newRate;
    }

    function setGlobalParams(
        uint256 _cycle,
        uint256 _interest,
        uint256 _fee,
        uint256 _maxDuration
    ) external onlyOwner {
        
        require(_cycle > 0, "Ciclo invalido.");
        require(_maxDuration > 0, "Duracao invalida.");
        globalPaymentCycle = _cycle;
        globalInterest = _interest;
        globalTerminationFee = _fee;
        maxLoanDuration = _maxDuration;
        
        emit GlobalParamsUpdated(_cycle, _interest, _fee, _maxDuration);
    }

    // ==========================================
    // CORE DEX & LOAN LOGIC
    // ==========================================

    function buyDex() external payable {
        require(msg.value > 0, "Tem de enviar ETH para comprar DEX.");
        uint256 dexAmount = (msg.value * 10**18) / dexSwapRate;
        require(balanceOf(address(this)) >= dexAmount, "O contrato nao tem tokens DEX suficientes.");
        
        _transfer(address(this), msg.sender, dexAmount);
    }

    
    function sellDex(uint256 dexAmount) external nonReentrant {
        require(dexAmount > 0, "Quantidade invalida.");
        require(balanceOf(msg.sender) >= dexAmount, "Tokens insuficientes.");
        uint256 ethAmount = (dexAmount * dexSwapRate) / 10**18;
        require(address(this).balance >= ethAmount, "Contrato sem ETH suficiente.");

        
        _transfer(msg.sender, address(this), dexAmount);

        
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "Falha ao enviar ETH.");
    }

    
    function loan(uint256 dexAmount, uint256 deadline) external nonReentrant returns (uint256) {
        require(dexAmount > 0, "Tem de fornecer colateral.");
        require(deadline > 0 && deadline <= maxLoanDuration, "Prazo invalido.");
        require(balanceOf(msg.sender) >= dexAmount, "DEX insuficiente.");

        uint256 snapshotRate = dexSwapRate; 
        uint256 collateralValueInWei = (dexAmount * snapshotRate) / 10**18;
        uint256 loanAmount = (collateralValueInWei * 50) / 100;

        require(address(this).balance >= loanAmount, "Contrato sem ETH.");

        
        _transfer(msg.sender, address(this), dexAmount);

        uint256 loanId = _nextLoanId++;
        loans[loanId] = Loan({
            borrower: msg.sender,
            collateral: dexAmount,
            amount: loanAmount,
            deadline: deadline,
            paymentCycle: globalPaymentCycle,
            interest: globalInterest,
            termination: globalTerminationFee,
            lastPaymentTime: block.timestamp,
            paymentsMade: 0,
            swapRateSnapshot: snapshotRate 
        });

        emit LoanCreated(msg.sender, loanId, loanAmount, deadline);

        
        (bool success, ) = payable(msg.sender).call{value: loanAmount}("");
        require(success, "Falha ao enviar emprestimo.");

        return loanId;
    }

    function makePayment(uint256 loanId) external payable nonReentrant {
        Loan storage currentLoan = loans[loanId];
        require(currentLoan.amount > 0, "O emprestimo nao existe.");
        require(msg.sender == currentLoan.borrower, "Nao e o dono.");

        uint256 limitTime = currentLoan.lastPaymentTime + currentLoan.paymentCycle;
        require(block.timestamp <= limitTime, "Prazo ultrapassado.");

        uint256 cyclePayment = (currentLoan.amount * currentLoan.interest) / (100 * currentLoan.deadline);
        bool isLastPayment = (currentLoan.paymentsMade == currentLoan.deadline - 1);
        uint256 amountToPay = isLastPayment ? (cyclePayment + currentLoan.amount) : cyclePayment;

        
        require(msg.value >= amountToPay, "Valor insuficiente.");
        uint256 excess = msg.value - amountToPay;

        if (isLastPayment) {
            
            address borrower = currentLoan.borrower;
            uint256 collateral = currentLoan.collateral;
            emit LoanFinished(borrower, loanId, currentLoan.amount);
            delete loans[loanId];

            
            _transfer(address(this), borrower, collateral);
        } else {
            
            currentLoan.paymentsMade++;
            currentLoan.lastPaymentTime = block.timestamp;
        }

        
        if (excess > 0) {
            (bool refundOk, ) = payable(msg.sender).call{value: excess}("");
            require(refundOk, "Falha ao devolver excesso.");
        }
    }

    function terminateLoan(uint256 loanId) external payable nonReentrant {
        Loan storage currentLoan = loans[loanId];
        require(currentLoan.amount > 0, "Nao existe.");
        require(msg.sender == currentLoan.borrower, "Nao autorizado.");

        uint256 totalToPay = currentLoan.amount + currentLoan.termination;
        if (msg.value != totalToPay) revert ValorIncorreto(totalToPay, msg.value);

        // EFFECTS antes de INTERACTIONS
        address borrower = currentLoan.borrower;
        uint256 collateral = currentLoan.collateral;
        emit LoanFinished(borrower, loanId, currentLoan.amount);
        delete loans[loanId];

        // INTERACTIONS
        _transfer(address(this), borrower, collateral);
    }


    function checkLoan(uint256 loanId) external nonReentrant {
        Loan storage currentLoan = loans[loanId];
        require(currentLoan.amount > 0, "Nao existe.");
        require(
            block.timestamp > currentLoan.lastPaymentTime + currentLoan.paymentCycle,
            "Emprestimo ainda em prazo."
        );

      
        address borrower = currentLoan.borrower;
        uint256 collateral = currentLoan.collateral;
        emit LoanDefaulted(borrower, loanId);
        delete loans[loanId];

      
        _transfer(address(this), owner(), collateral);
    }

    function getBalance() external view returns (uint256) { return address(this).balance; }
    function getDexBalance() external view returns (uint256) { return balanceOf(msg.sender); }
}
