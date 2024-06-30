async function submitScore(name, score, blocksClimbed) {
  if (!contract || !account) {
    console.error('Contract not initialized or account not available');
    return false;
  }
  
  if (typeof name !== 'string' || name.length === 0) {
    console.error('Invalid name provided');
    return false;
  }
  if (typeof score !== 'number' || isNaN(score)) {
    console.error('Invalid score provided');
    return false;
  }
  if (typeof blocksClimbed !== 'number' || isNaN(blocksClimbed)) {
    console.error('Invalid blocksClimbed provided');
    return false;
  }

  try {
    const gasPrice = await web3.eth.getGasPrice();
    // Dynamic gas estimation based on current network conditions
    const gasEstimate = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTime).estimateGas({ from: account });

    const result = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTime).send({ 
      from: account,
      gas: gasEstimate, // Use estimated gas
      gasPrice: gasPrice
    });
    console.log('Score submitted successfully:', result);
    return true;
  } catch (error) {
    console.error('Error submitting score:', error);
    return false;
  }
}
