# Aave Dai Deposit Proxy

- Users deposit with dai token into Aave and get a shareAmount.
- Users deposit in different storages according to tokenId and receive the corresponding shareAmount.
- Also Users withdraw with the selected amount, shareAmount and all about tokenId.

## Variable

#### totalShareAmount
Total shares of tokenId.
```
  totalShareAmount = 10 ** 18;
```  


## Functions

#### deposit(uint256 _tokenId)

- Users deposit with Dai token to the TokenId and will get a shareAmount about TokenId. 
  In here, dai token amount is the dai token amount of strategy.

```
  shareAmount = userDaiToken * totalShareAmount / totalDaiTokenByTokenId
```  


#### withdraw(uint256 tokenId, uint256 shareAmount) external returns (uint256);
- Users withdraw with dai token amounts about shareAmount of the tokenId.
- Return daiTokenAmount

```
  daiTokenAmount = shareAmount * totalDaiTokenByTokenId / totalShareAmount.
```


#### withdrawAll(uint256 tokenId)
- Users withdraw with all dai token amounts of the tokenId.
- Return daiTokenAmount

```
  daiTokenAmount = userAmount * totalDaiTokenByTokenId / totalShareAmount.
```

#### withdrawToken(uint256 tokenId, uint256 amount)
- Users withdraw with dai token selected amounts of the tokenId.

