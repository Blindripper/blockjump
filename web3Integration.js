async function purchaseGameTries() {
  if (!contract || !account) {
      console.error('Contract not initialized or account not available');
      return false;
  }

  try {
      const txHash = await contract.methods.purchaseGameTries().send({ 
          from: account, 
          value: web3.utils.toWei('0.01', 'ether')
      });

      console.log('Transaction sent:', txHash.transactionHash); // Capture the transaction hash

      // Listen for the GameTryPurchased event
      const subscription = contract.events.GameTryPurchased({ fromBlock: txHash.blockNumber }, (error, event) => {
          if (error) {
              console.error('Error in GameTryPurchased event:', error);
              return;
          }

          console.log('Game tries purchased successfully:', event.returnValues);
          
          // Update gameTries or UI based on the event data (optional)

          subscription.unsubscribe(); // Unsubscribe after receiving the event
      });

      return true;
  } catch (error) {
      console.error('Error purchasing game tries:', error);
      return false;
  }
}
