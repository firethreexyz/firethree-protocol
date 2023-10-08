import { Keypair, PublicKey } from "@solana/web3.js";
import { Firethree } from "../target/types/firethree";
import { encodeName, decodeName } from "../sdk/src/utils/name";
import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import IDL from "../sdk/src/idl/firethree.json";

describe("Firethree", () => {
  const name = encodeName("Firethree");
  const provider = anchor.AnchorProvider.local(
    "https://api.devnet.solana.com",
    {
      preflightCommitment: "confirmed",
      skipPreflight: false,
      commitment: "confirmed",
    }
  );

  const program = new anchor.Program<Firethree>(
    IDL as any,
    "Fire3T9ABT33UYoVJZwWUnbPR3rgoVw98y82UgHZ8Bm",
    provider
  );

  anchor.setProvider(provider);

  it("Should able to create a project", async () => {
    const [ProjectPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(name)],
      program.programId
    );

    await program.methods
      .projectCreate({
        name,
        shdw: new Keypair().publicKey,
        multisig: new Keypair().publicKey,
        createKey: new Keypair().publicKey,
      })
      .accounts({
        payer: provider.wallet.publicKey,
        project: ProjectPDA,
      })
      .rpc();

    const firethree = await program.account.project.fetch(ProjectPDA);

    console.log("On-chain data is:", firethree);

    expect(decodeName(firethree.name)).equal(decodeName(name));
  });

  it("Should able to get a project", async () => {
    const [ProjectPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(name)],
      program.programId
    );

    const firethree = await program.account.project.fetch(ProjectPDA);

    console.log("On-chain data is:", firethree);

    expect(decodeName(firethree.name)).equal(decodeName(name));
  });

  it("Should able to delete a project", async () => {
    const [ProjectPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(name)],
      program.programId
    );

    let firethree;
    try {
      await program.methods
        .projectDelete()
        .accounts({
          payer: provider.wallet.publicKey,
          project: ProjectPDA,
        })
        .rpc();

      firethree = await program.account.project.fetch(ProjectPDA);
    } catch {}

    expect(firethree).to.be.undefined;
  });
});
