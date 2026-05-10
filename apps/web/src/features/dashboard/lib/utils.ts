import { Connection } from "@solana/web3.js";

export const confirmTx = async (connection: Connection, signature: string) => {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  while (true) {
    const res = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });

    const status = res.value[0];

    if (status?.err) {
      throw new Error("Transaction failed");
    }

    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      return status;
    }

    const currentBlockHeight = await connection.getBlockHeight();

    if (currentBlockHeight > lastValidBlockHeight) {
      throw new Error("Transaction expired");
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
};
