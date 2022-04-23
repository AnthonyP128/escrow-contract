const algosdk = require("algosdk");
const escrow = require("./contracts/escrow");
const clear = require("./contracts/clear");

async function compileProgram(client, programSource) {
	let encoder = new TextEncoder();
	let programBytes = encoder.encode(programSource);
	let compileResponse = await client.compile(programBytes).do();
	let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
	return compiledBytes;
}

//Encodes to utf8String
function EncodeBytes(utf8String) {
	let enc = new TextEncoder();
	return enc.encode(utf8String);
}

//Encodes the int or string to Bytes for contract
function EncodeUint(intOrString) {
	var hex = BigInt(intOrString.toString()).toString(16);
	if (hex.length % 2) {
		hex = "0" + hex;
	}

	var len = hex.length / 2;
	var u8 = new Uint8Array(len);
	var i = 0;
	var j = 0;

	while (i < len) {
		u8[i] = parseInt(hex.slice(j, j + 2), 16);
		i += 1;
		j += 2;
	}
	return u8;
}

async function deploy() {
	try {
		const baseServer = "https://testnet-algorand.api.purestake.io/ps2";
		const port = "";
		const token = { "X-API-Key": "y6oxRqf5Ck3WHTcWqKd2y5jxZqB16lHY7XJ5s0WV" };

		const algodClient = new algosdk.Algodv2(token, baseServer, port);
		let params = await algodClient.getTransactionParams().do();

		const senderSeed =
			"enough bracket fault select oval keep treat tiny rely onion wet this online major report total blossom unfair travel faith state chef earth abstract before";
		let senderAccount = algosdk.mnemonicToSecretKey(senderSeed);
		let sender = senderAccount.addr;

		let escrowProgram = await compileProgram(algodClient, escrow);
		let clearProgram = await compileProgram(algodClient, clear);
		let onComplete = algosdk.OnApplicationComplete.NoOpOC;

		let localInts = 0;
		let localBytes = 0;
		let globalInts = 3;
		let globalBytes = 3;

		let accounts = undefined;
		let foreignApps = undefined;
		let foreignAssets = undefined;
		let amount = 100000;
		let appID = 83070027; //update

		let appAdmin = new algosdk.decodeAddress(sender);

		let appArgs = [];
		appArgs.push(appAdmin.publicKey);
		let appArgs2 = [];
		appArgs2.push(EncodeBytes("transfer"));
		appArgs2.push(EncodeUint(amount));

		//Deploy the Contract to the Testnet, comment out when done
		// let deployContract = algosdk.makeApplicationCreateTxn(
		// 	sender,
		// 	params,
		// 	onComplete,
		// 	escrowProgram,
		// 	clearProgram,
		// 	localInts,
		// 	localBytes,
		// 	globalInts,
		// 	globalBytes,
		// 	appArgs,
		// 	accounts,
		// 	foreignApps,
		// 	foreignAssets
		// );
		// let signedTxn = deployContract.signTxn(senderAccount.sk);

		//Call the contract from testnet, comment out if want to deploy
		let callContract = algosdk.makeApplicationNoOpTxn(sender, params, appID, appArgs2, undefined, undefined, undefined);
		let signedTxn = callContract.signTxn(senderAccount.sk);

		// Submit the transaction
		let tx = await algodClient.sendRawTransaction(signedTxn).do();
		let confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);
		let transactionResponse = await algodClient.pendingTransactionInformation(tx.txId).do();
		let appId = transactionResponse["application-index"];

		//Get the completed Transaction
		console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
		console.log("The application ID is: " + appId);
	} catch (err) {
		console.log("err", err);
	}
	process.exit();
}

deploy();
