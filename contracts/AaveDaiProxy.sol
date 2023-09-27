// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;

    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IStrategy {
    function deposit(uint256 tokenId, uint256 amount) external;

    function withdraw(uint256 tokenId, uint256 shareAmount) external returns (uint256);

    function withdrawAll(uint256 tokenId) external returns (uint256);

    function getAmountOfTokenId(uint256 tokenId) external view returns (uint256);

    function withdrawToken(uint256 tokenId, uint256 amount) external;
}

interface IAToken is IERC20 {
    function pool() external returns (address);
}

/**
 * @dev Aave Dai Proxy Contract
 */
contract AaveDaiProxy is IStrategy, ReentrancyGuard, Initializable, UUPSUpgradeable, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    mapping(uint256 => uint256) public userShares; // id => share
    uint256 public totalShares;

    IERC20 public immutable token; // DAI address
    IAToken public immutable aToken; // aDAI token address
    IAavePool public immutable pool;
    uint16 public constant REFERRAL_CODE = 0xaa;

    event Deposit(uint256 id, uint256 shares, uint256 amount);
    event Withdraw(uint256 id, uint256 shares, uint256 amount);

    /**
     * @param _dai DAI ERC20 Token address.
     * @param _aDAI aDAI ERC20 Token address.
     * @param _pool Aave pool address.
     */
    constructor(address _dai, address _aDAI, address _pool) {
        require(_dai != address(0) && _aDAI != address(0) && _pool != address(0), "Invalid");

        token = IERC20(_dai);
        pool = IAavePool(_pool);
        aToken = IAToken(_aDAI);

        token.approve(address(pool), type(uint256).max);
        _disableInitializers();
    }

    /// Internal Functions
    /**
     * @dev internal _withdraw function with tokenId and shares for withdraw.
     * @param tokenId unique token IDs for each user's deposit.
     * @param shares for DAI token amount.
     * @return amount of DAI token.
     */
    function _withdraw(uint256 tokenId, uint256 shares) internal returns (uint256 amount) {
        uint256 aTokenAmount = _sharesToAmount(shares);
        uint256 beforeBalance = token.balanceOf(msg.sender);
        pool.withdraw(address(token), aTokenAmount, msg.sender);

        amount = token.balanceOf(msg.sender) - beforeBalance;
        userShares[tokenId] -= shares;
        totalShares -= shares;

        emit Withdraw(tokenId, shares, amount);
    }

    /**
     * @dev internal _sharesToAmount function that calculates the amount in shares.
     * @param shares for DAI token amount.
     * @return amount of DAI token.
     */
    function _sharesToAmount(uint256 shares) internal view returns (uint256 amount) {
        uint256 totalAmount = aToken.balanceOf(address(this));
        amount = totalShares == 0 ? type(uint).max : shares.mul(totalAmount).div(totalShares);
    }

    /// External Functions
    /**
     * @dev deposit function that calculates the shares in Dai token amount.
     * @param tokenId unique token IDs for each user's deposit.
     * @param amount of DAI token.
     */
    function deposit(uint256 tokenId, uint256 amount) external override nonReentrant {
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 prevBalance = aToken.balanceOf(address(this));
        pool.supply(address(token), amount, address(this), REFERRAL_CODE);

        uint256 aTokenAmount = aToken.balanceOf(address(this)) - prevBalance;
        uint256 shares = totalShares > 0 ? (aTokenAmount * totalShares) / prevBalance : 1e18;
        totalShares += shares;
        userShares[tokenId] += shares;
        emit Deposit(tokenId, shares, amount);
    }

    /**
     * @dev withdraw function with tokenId and shares for withdraw.
     * @param tokenId unique token IDs for each user's deposit.
     * @param shares of DAI token amount.
     * @return amount of DAI token.
     */
    function withdraw(uint256 tokenId, uint256 shares) external override nonReentrant returns (uint256 amount) {
        require(shares <= userShares[tokenId], "Invalid shares");
        amount = _withdraw(tokenId, shares);
    }

    /**
     * @dev withdrawAll function with tokenId for withdraw.
     * @param tokenId unique token IDs for each user's deposit.
     * @return amount of DAI token.
     */
    function withdrawAll(uint256 tokenId) external override nonReentrant returns (uint256 amount) {
        amount = _withdraw(tokenId, userShares[tokenId]);
    }

    /**
     * @dev get Amount from token Id..
     * @param tokenId unique token IDs for each user's deposit.
     * @return amount of DAI token.
     */
    function getAmountOfTokenId(uint256 tokenId) external view override returns (uint256 amount) {
        amount = _sharesToAmount(userShares[tokenId]);
    }

    /**
     * @dev withdrawToken for tokenId and amount.
     * @param tokenId unique token IDs for each user's deposit.
     * @param amount unique token IDs for each user's deposit.
     */
    function withdrawToken(uint256 tokenId, uint256 amount) external override nonReentrant {
        require(amountToShares(amount) <= userShares[tokenId], "Invalid");
        _withdraw(tokenId, amountToShares(amount));
    }

    /**
     * @dev public amountToShares function that calculates the shares in Dai token amount.
     * @param amount DAI token amount.
     * @return shares of DAI token amount.
     */
    function amountToShares(uint256 amount) public view returns (uint256 shares) {
        uint256 totalAmount = aToken.balanceOf(address(this));
        shares = totalAmount == 0 ? type(uint).max : amount.mul(totalShares).div(totalAmount);
    }


    /**
     * @dev Admin uses "updateTo" function to update instead of "updateCode". Only admin can call that function.
     * @param newCode upgrade contract address
     */
    function _authorizeUpgrade(address newCode) internal override onlyOwner {}
}
