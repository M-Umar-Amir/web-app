import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/router";
import { useState } from "react";
import { db } from "../firebase/config";
import ConnectWalletButton from "@/components/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/utils/cn";
import truncate from "@/utils/truncate";


type ResultStatus = "idle" | "success" | "failed";

export default function HomePage() {
  const router = useRouter();
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultStatus>("idle");
  const [signature, setSignature] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const nestAddresses: { [key: string]: string } = {
    "Nest Starter": "9yrhTTh3y29NDVjxDzfo3tyiJ31r6DH42HiroGe2WASk",
    "Golden Nest": "AnL8JWUWKC3WdWoST1bDLvrG1geMSaaWK72LupNNVLCb",
    "Elite Nest": "5xsG6MEY6xYTc5kaK1kSvUGXiAaBfer9vao2GXhEbXJA",
  };

  const [selectedPlan, setSelectedPlan] = useState("");
  const handlePlanChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const plan = event.target.value;
    setSelectedPlan(plan);
    setReceiver(nestAddresses[plan]);
    console.log("Current Receiver:", nestAddresses[plan]);
  };


  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Helper function to poll for transaction confirmation using the HTTPS endpoint.
  const pollForConfirmation = async (signature: string) => {
    let confirmed = false;
    while (!confirmed) {
      const status = await connection.getSignatureStatus(signature);
      if (status.value && status.value.confirmationStatus === 'confirmed') {
        confirmed = true;
      } else {
        // Wait for 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const isValidSolanaAddress = (address: string) => {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };

  const saveTransactionToFirestore = async (signature: string) => {
    const { card, email } = router.query;
    if (card && publicKey) {
      try {
        const transactionData = {
          senderEmail: email,
          senderPublicKey: publicKey.toString(),
          receiverPublicKey: receiver,
          card: selectedPlan,
          amount,
          timestamp: new Date().toISOString(),
          signature,
          status: "submitted",
        };
        await addDoc(collection(db, "transactions"), transactionData);
      } catch (error) {
        console.error("Failed to save transaction:", error);
      }
    }
  };

  const submitTransaction = async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    // Validate receiver address before proceeding
    if (!isValidSolanaAddress(receiver)) {
      setErrorMessage("Invalid receiver address");
      return;
    }

    // Validate the entered amount: it must be a positive number
    const lamports = parseFloat(amount);
    if (isNaN(lamports) || lamports <= 0) {
      setErrorMessage("Invalid amount");
      return;
    }

    let txSignature: string | undefined;

    try {
      setLoading(true);
      setResult("idle");
      setSignature("");
      setErrorMessage("");

      // Create a transfer instruction for the transaction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(receiver),
        lamports: lamports * LAMPORTS_PER_SOL,
      });

      // Build the transaction
      const transaction = new Transaction().add(transferInstruction);
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send the transaction and retrieve its signature
      if (window.solana && window.solana.isPhantom && window.solana.signAndSendTransaction) {
        const response = await window.solana.signAndSendTransaction(transaction);
        txSignature = response.signature;
      } else {
        throw new Error("Phantom wallet with signAndSendTransaction method is required.");
      }
      // Ensure txSignature is a valid string before updating state
      if (txSignature) {
        setSignature(txSignature);
      } else {
        setErrorMessage("Transaction signature is undefined.");
      }

      if (!txSignature) {
        throw new Error("Transaction signature is undefined.");
      }

      // Instead of using WebSocket-based confirmation, poll for confirmation via HTTPS
      await pollForConfirmation(txSignature);

      // If everything goes well, mark the transaction as successful and save details
      setResult("success");
      if (txSignature) await saveTransactionToFirestore(txSignature);
    } catch (error) {
      const err = error as Error;
      const errMessage = err.message || "";

      // Specifically handle user cancellation errors
      if (errMessage.includes("User rejected") || errMessage.includes("rejected")) {
        setErrorMessage("Transaction cancelled by user");
      } else {
        setErrorMessage(errMessage);
      }
      setResult("failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto my-20 flex w-full max-w-md flex-col gap-6 rounded-2xl p-6 ">
      <Typography as="h2" level="h6" className="font-bold">
        Transfer
      </Typography>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Typography level="body4" color="secondary">
            Sender
          </Typography>
          <Typography level="body4" className="font-semibold">
            {publicKey ? truncate(publicKey.toBase58(), 16, true) : "--"}
          </Typography>
        </div>
        <select
          value={selectedPlan}
          title="select"
          onChange={handlePlanChange}
          className="p-2 w-full rounded-md border-gray-300 bg-gray-100 text-black"
        >
          <option value="">Select Nest Plan</option>
          <option value="Nest Starter">Nest Starter</option>
          <option value="Golden Nest">Golden Nest</option>
          <option value="Elite Nest">Elite Nest</option>
        </select>
        <Input
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Amount"
        />
        {connected ? (
          <Button loading={loading} disabled={!receiver || !amount} onClick={submitTransaction}>
            Send
          </Button>
        ) : (
          <ConnectWalletButton />
        )}
        {result !== "idle" && (
          <div
            className={cn("rounded-xl p-4", {
              "bg-success-100 text-success-900": result === "success",
              "bg-error-100 text-error-900": result === "failed",
            })}
          >
            {result === "success" ? (
              <p>Transaction Successful</p>
            ) : (
              <p>Transaction failed</p>
            )}
          </div>
        )}
        {errorMessage && (
          <div className="bg-orange-100 text-red-900 rounded-xl p-4">
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}