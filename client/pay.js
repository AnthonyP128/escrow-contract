const algosdk = require("algosdk");
const { getApplicationAddress } = require("algosdk");

async function pay() {
	try {
		// Connect to Agorand testnet network
		const baseServer = "https://testnet-algorand.api.purestake.io/ps2";
		const port = "";
		const token = { "X-API-Key": "y6oxRqf5Ck3WHTcWqKd2y5jxZqB16lHY7XJ5s0WV" };

		//Creates a new client
		const algodClient = new algosdk.Algodv2(token, baseServer, port);
		let params = await algodClient.getTransactionParams().do();

		// Allocates the sender seed
		const senderSeed =
			"enough bracket fault select oval keep treat tiny rely onion wet this online major report total blossom unfair travel faith state chef earth abstract before";
		let senderAccount = algosdk.mnemonicToSecretKey(senderSeed);
		let sender = senderAccount.addr;

		// Escrow contract identification
		let escrowID = 83070027; //change this
		let escrowAddress = getApplicationAddress(escrowID); // Gets the escrow address of application
		amount = 100000;

		// Make the payment with the params
		let payment = algosdk.makePaymentTxnWithSuggestedParams(sender, escrowAddress, amount, undefined, undefined, params);
		let signedTxn = payment.signTxn(senderAccount.sk);

		// Submit the transaction
		let tx = await algodClient.sendRawTransaction(signedTxn).do();
		let confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);
		let transactionResponse = await algodClient.pendingTransactionInformation(tx.txId).do();

		//Get the completed Transaction
		console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
	} catch (err) {
		console.log("err", err);
	}
	process.exit();
}

pay();
