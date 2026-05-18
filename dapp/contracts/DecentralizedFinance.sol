// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DecentralizedFinance is ERC20 {
    address public owner; 
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
    }

    error ValorIncorreto(uint256 valorEsperado, uint256 valorEnviado);
    mapping(uint256 => Loan) public loans;
    
    event loanCreated(address borrower, uint256 amount, uint256 deadline); 
    event loanFinished(address borrower, uint256 amount); 

    constructor(
        uint256 _dexSwapRate,
        uint256 _paymentCycle,
        uint256 _interest,
        uint256 _terminationFee,
        uint256 _maxLoanDuration   
    ) ERC20("DEX", "DEX") {
        owner = msg.sender;
        dexSwapRate = _dexSwapRate;
        globalPaymentCycle = _paymentCycle;
        globalInterest = _interest;
        globalTerminationFee = _terminationFee;
        maxLoanDuration = _maxLoanDuration;
        _mint(address(this), 10**18 * (10 ** decimals()));
        _nextLoanId = 1;
    }

    receive() external payable {}

    modifier onlyOwner() {
        require(msg.sender == owner, "Apenas o dono do contrato pode chamar esta funcao.");
        _;
    }

    // ==========================================
    // ADMINISTRATOR CONSOLE FUNCTIONS
    // ==========================================
    function setDexSwapRate(uint256 _newRate) external onlyOwner {
        dexSwapRate = _newRate;
    }

    function setGlobalParams(uint256 _cycle, uint256 _interest, uint256 _fee, uint256 _maxDuration) external onlyOwner {
        globalPaymentCycle = _cycle;
        globalInterest = _interest;
        globalTerminationFee = _fee;
        maxLoanDuration = _maxDuration;
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

    function sellDex(uint256 dexAmount) external {
        require(dexAmount > 0, "Quantidade invalida.");
        require(balanceOf(msg.sender) >= dexAmount, "Tokens insuficientes.");
        uint256 ethAmount = (dexAmount * dexSwapRate) / 10**18;
        require(address(this).balance >= ethAmount, "Contrato sem ETH suficiente.");
        
        _transfer(msg.sender, address(this), dexAmount);
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "Falha ao enviar ETH.");
    }

    function loan(uint256 dexAmount, uint256 deadline) external returns (uint256) {
        require(dexAmount > 0, "Tem de fornecer colateral.");
        require(deadline > 0 && deadline <= maxLoanDuration, "Prazo invalido.");
        require(balanceOf(msg.sender) >= dexAmount, "DEX insuficiente.");

        uint256 collateralValueInWei = (dexAmount * dexSwapRate) / 10**18;
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
            paymentsMade: 0
        });

        emit loanCreated(msg.sender, loanAmount, deadline);
        (bool success, ) = payable(msg.sender).call{value: loanAmount}("");
        require(success, "Falha ao enviar emprestimo.");

        return loanId;
    }

    function makePayment(uint256 loanId) external payable {
        Loan storage currentLoan = loans[loanId];
        require(currentLoan.amount > 0, "O emprestimo nao existe.");
        require(msg.sender == currentLoan.borrower, "Nao e o dono.");

        uint256 limitTime = currentLoan.lastPaymentTime + currentLoan.paymentCycle;
        if (block.timestamp > limitTime) {
            emit loanFinished(currentLoan.borrower, currentLoan.amount);
            delete loans[loanId];
            revert("Prazo ultrapassado. Colateral liquidado.");
        }

        uint256 cyclePayment = (currentLoan.amount * currentLoan.interest) / (100 * currentLoan.deadline);
        bool isLastPayment = (currentLoan.paymentsMade == currentLoan.deadline - 1);

        if (isLastPayment) {
            // FIXED BUG: totalDue properly sums the final interest payment and the principal refund
            uint256 totalDue = cyclePayment + currentLoan.amount;
            if (msg.value != totalDue) revert ValorIncorreto(totalDue, msg.value);

            _transfer(address(this), currentLoan.borrower, currentLoan.collateral);
            emit loanFinished(currentLoan.borrower, currentLoan.amount);
            delete loans[loanId];
        } else {
            if (msg.value != cyclePayment) revert ValorIncorreto(cyclePayment, msg.value);
            currentLoan.paymentsMade++;
            currentLoan.lastPaymentTime = block.timestamp;
        }
    }

    function terminateLoan(uint256 loanId) external payable {
        Loan storage currentLoan = loans[loanId];
        require(currentLoan.amount > 0, "Nao existe.");
        require(msg.sender == currentLoan.borrower, "Nao autorizado.");

        uint256 totalToPay = currentLoan.amount + currentLoan.termination;
        if (msg.value != totalToPay) revert ValorIncorreto(totalToPay, msg.value);

        _transfer(address(this), currentLoan.borrower, currentLoan.collateral);
        emit loanFinished(currentLoan.borrower, currentLoan.amount);
        delete loans[loanId];
    }

    function checkLoan(uint256 loanId) external onlyOwner {
        Loan storage currentLoan = loans[loanId];
        require(currentLoan.amount > 0, "Nao existe.");
        if (block.timestamp > currentLoan.lastPaymentTime + currentLoan.paymentCycle) {
            emit loanFinished(currentLoan.borrower, currentLoan.amount);
            delete loans[loanId];
        }
    }

    function getBalance() external view returns (uint256) { return address(this).balance; }
    function getDexBalance() external view returns (uint256) { return balanceOf(msg.sender); }
}