import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import type { Twoside } from "../target/types/twoside";
import * as splToken from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  KeypairSigner,
  none,
  signerIdentity,
  Umi,
} from "@metaplex-foundation/umi";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import {
  Collection,
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionDataArgs,
  Creator,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  Uses,
} from "@metaplex-foundation/mpl-token-metadata";
import { Connection, PublicKey } from "@solana/web3.js";

class Setup {
  private static instance: Setup | null = null;

  public GLOBAL_INFO_STATIC_SEED: Buffer<ArrayBuffer> =
    Buffer.from("global_info");
  public TOKEN_INFO_STATIC_SEED: Buffer<ArrayBuffer> =
    Buffer.from("token_info");
  public VAULT_AUTHORITY_STATIC_SEED: Buffer<ArrayBuffer> =
    Buffer.from("vault_authority");
  public METADATA_STATIC_SEED: Buffer<ArrayBuffer> = Buffer.from("metadata");
  public DERIVATIVE_AUTHORITY_STATIC_SEED: Buffer<ArrayBuffer> = Buffer.from(
    "derivative_authority",
  );
  public DERIVATIVE_MINT_STATIC_SEED: Buffer<ArrayBuffer> =
    Buffer.from("derivative_mint");

  public provider: anchor.AnchorProvider;
  public connection: anchor.web3.Connection;
  public umi: Umi;
  public umiSigner: KeypairSigner;

  public program: anchor.Program<Twoside>;

  public developer: anchor.web3.Keypair;
  public founder: anchor.web3.Keypair;
  public fee_percentage: number;
  public fee_percentage_divider: number;

  public user: anchor.web3.Keypair;
  public payer: anchor.web3.Keypair;
  public lamportsBalance: number;

  public globalInfoPDA: anchor.web3.PublicKey;
  public globalInfoBump: number;

  // Track standard SPL token mint
  public tokenMint: anchor.web3.PublicKey = null;

  // Track Token-2022 mint
  public token2022Mint: anchor.web3.PublicKey = null;

  private constructor() {}

  public static getInstance(): Setup {
    if (Setup.instance === null) {
      Setup.instance = new Setup();
    }
    return Setup.instance;
  }

  public async initialize() {
    this.provider = anchor.AnchorProvider.env();
    anchor.setProvider(this.provider);
    this.connection = this.provider.connection;

    this.program = anchor.workspace.Twoside as Program<Twoside>;

    this.developer = anchor.web3.Keypair.generate();
    this.founder = anchor.web3.Keypair.generate();
    this.fee_percentage = 5;
    this.fee_percentage_divider = 1000;

    this.user = anchor.web3.Keypair.generate();
    this.payer = anchor.web3.Keypair.generate();
    this.lamportsBalance = 10 * anchor.web3.LAMPORTS_PER_SOL;
    await this.airdropToWallet(this.payer.publicKey, this.lamportsBalance);
    await this.airdropToWallet(this.user.publicKey, this.lamportsBalance);
    await this.airdropToWallet(this.founder.publicKey, this.lamportsBalance);
    await this.airdropToWallet(this.developer.publicKey, this.lamportsBalance);

    [this.globalInfoPDA, this.globalInfoBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.GLOBAL_INFO_STATIC_SEED],
        this.program.programId,
      );

    this.umi = createUmi(this.connection.rpcEndpoint);
    this.umiSigner = createSignerFromKeypair(
      this.umi,
      fromWeb3JsKeypair(this.payer),
    );
    this.umi.use(signerIdentity(this.umiSigner, true));
  }

  public async airdropToWallet(
    publicKey: anchor.web3.PublicKey,
    balance: number,
  ) {
    const sig = await this.connection.requestAirdrop(publicKey, balance);
    await this.connection.confirmTransaction(sig, "finalized");
  }

  // ✅ Helper to create a standard SPL token mint
  public async generateTokenMint(
    decimals: number,
  ): Promise<anchor.web3.PublicKey> {
    const mint = await splToken.createMint(
      this.connection,
      this.payer,
      this.payer.publicKey,
      this.payer.publicKey,
      decimals,
    );
    return (this.tokenMint = mint);
  }

  // ✅ Helper to create a Token-2022 mint with Metadata Pointer and Metadata extensions initialized
  public async generateToken2022Mint(
    decimals: number,
    name: string,
    symbol: string,
    uri: string,
  ): Promise<anchor.web3.PublicKey> {
    const mintKeypair = anchor.web3.Keypair.generate();
    const mint = mintKeypair.publicKey;

    const metadata = {
      mint: mint,
      name: name,
      symbol: symbol,
      uri: uri,
      additionalMetadata: [],
    };

    const extensions = [splToken.ExtensionType.MetadataPointer];
    const mintLen = splToken.getMintLen(extensions);
    const metadataLen =
      splToken.TYPE_SIZE + splToken.LENGTH_SIZE + pack(metadata).length;
    const lamports = await this.connection.getMinimumBalanceForRentExemption(
      mintLen + metadataLen,
    );

    const transaction = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: this.payer.publicKey,
        newAccountPubkey: mint,
        space: mintLen + metadataLen,
        lamports,
        programId: splToken.TOKEN_2022_PROGRAM_ID,
      }),
      splToken.createInitializeMetadataPointerInstruction(
        mint,
        this.payer.publicKey,
        mint,
        splToken.TOKEN_2022_PROGRAM_ID,
      ),
      splToken.createInitializeMintInstruction(
        mint,
        decimals,
        this.payer.publicKey,
        this.payer.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeInstruction({
        programId: splToken.TOKEN_2022_PROGRAM_ID,
        mint: mint,
        metadata: mint,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: this.payer.publicKey,
        updateAuthority: this.payer.publicKey,
      }),
    );

    await anchor.web3.sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.payer, mintKeypair],
      { commitment: "confirmed" },
    );

    return (this.token2022Mint = mint);
  }

  public getTokenMetadataPDA(mint: anchor.web3.PublicKey): {
    pda: anchor.web3.PublicKey;
    bump: number;
  } {
    const [derivativeMetadataPDA, derivativeMetadataBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          this.METADATA_STATIC_SEED,
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          mint.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
      );
    return {
      pda: derivativeMetadataPDA,
      bump: derivativeMetadataBump,
    };
  }

  public async deployMetaplexMetadata(
    name: string,
    symbol: string,
    uri: string,
    mint: anchor.web3.PublicKey,
  ) {
    const onChainData = {
      name,
      symbol,
      uri,
      sellerFeeBasisPoints: 0,
      creators: none<Creator[]>(),
      collection: none<Collection>(),
      uses: none<Uses>(),
    };
    const accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint: fromWeb3JsPublicKey(mint),
      mintAuthority: this.umiSigner,
    };
    const data: CreateMetadataAccountV3InstructionDataArgs = {
      isMutable: true,
      collectionDetails: null,
      data: onChainData,
    };
    await createMetadataAccountV3(this.umi, {
      ...accounts,
      ...data,
    }).sendAndConfirm(this.umi);
  }

  public getTokenInfoPDA(mint: anchor.web3.PublicKey): {
    pda: anchor.web3.PublicKey;
    bump: number;
  } {
    const [tokenInfoPDA, tokenInfoBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.TOKEN_INFO_STATIC_SEED, mint.toBuffer()],
        this.program.programId,
      );
    return {
      pda: tokenInfoPDA,
      bump: tokenInfoBump,
    };
  }

  // ✅ Accept custom token program ID (defaults to standard TOKEN_PROGRAM_ID)
  public async getTokenATA(
    mint: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    tokenProgramId: anchor.web3.PublicKey = splToken.TOKEN_PROGRAM_ID,
  ) {
    return await splToken.getOrCreateAssociatedTokenAccount(
      this.connection,
      this.payer,
      mint,
      owner,
      undefined,
      "confirmed",
      undefined,
      tokenProgramId,
    );
  }

  // ✅ Accept custom token program ID
  public getDerivativeATA(
    derivativeMint: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    tokenProgramId: anchor.web3.PublicKey = splToken.TOKEN_PROGRAM_ID,
  ): anchor.web3.PublicKey {
    const [derivativeAta] = PublicKey.findProgramAddressSync(
      [owner.toBuffer(), tokenProgramId.toBuffer(), derivativeMint.toBuffer()],
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    return derivativeAta;
  }

  // ✅ Accept custom token program ID
  public getTokenVault(
    mint: anchor.web3.PublicKey,
    tokenProgramId: anchor.web3.PublicKey = splToken.TOKEN_PROGRAM_ID,
  ): {
    authority: anchor.web3.PublicKey;
    authorityBump: number;
    ata: anchor.web3.PublicKey;
    ataBump: number;
  } {
    const [vaultAuthorityPDA, vaultAuthorityBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.VAULT_AUTHORITY_STATIC_SEED, mint.toBuffer()],
        this.program.programId,
      );

    const [vaultAta, vaultAtaBump] = PublicKey.findProgramAddressSync(
      [
        vaultAuthorityPDA.toBuffer(),
        tokenProgramId.toBuffer(),
        mint.toBuffer(),
      ],
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    return {
      authority: vaultAuthorityPDA,
      authorityBump: vaultAuthorityBump,
      ata: vaultAta,
      ataBump: vaultAtaBump,
    };
  }

  public getDerivativeAuthority(mint: anchor.web3.PublicKey): {
    pda: anchor.web3.PublicKey;
    bump: number;
  } {
    const [derivativeAuthorityPDA, derivativeAuthorityBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.DERIVATIVE_AUTHORITY_STATIC_SEED, mint.toBuffer()],
        this.program.programId,
      );

    return {
      pda: derivativeAuthorityPDA,
      bump: derivativeAuthorityBump,
    };
  }

  public getDerivativeMint(mint: anchor.web3.PublicKey): {
    pda: anchor.web3.PublicKey;
    bump: number;
  } {
    const [derivativeMintPDA, derivativeMintBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [this.DERIVATIVE_MINT_STATIC_SEED, mint.toBuffer()],
        this.program.programId,
      );

    return {
      pda: derivativeMintPDA,
      bump: derivativeMintBump,
    };
  }

  public calculateFee(amount: number): number {
    return (amount * this.fee_percentage) / this.fee_percentage_divider;
  }

  public feeShare(fee: number): number {
    return fee / 2;
  }

  public getDerivativeName(tokenName: string): string {
    return "Liquid " + tokenName;
  }

  public getDerivativeSymbol(tokenSymbol: string): string {
    return "li" + tokenSymbol;
  }
}

export const setup: Setup = Setup.getInstance();

export async function fetchLogsFromSignature(
  connection: Connection,
  signature: string,
  commitment: anchor.web3.Finality = "confirmed",
): Promise<string[] | null> {
  const tx = await connection.getTransaction(signature, { commitment });
  if (tx && tx.meta && tx.meta.logMessages) {
    return tx.meta.logMessages;
  }
  return null;
}
