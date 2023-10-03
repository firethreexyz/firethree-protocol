import { PublicKey } from "@solana/web3.js";
import { Firethree } from "../target/types/firethree";
import { encodeName, decodeName } from "../sdk/src/utils/name";
import * as anchor from "@coral-xyz/anchor";
import IDL from "../sdk/src/idl/firethree.json";
import { expect } from "chai";

describe("Firethree", () => {
  const provider = anchor.AnchorProvider.local(
    "https://api.devnet.solana.com",
    {
      preflightCommitment: "confirmed",
      skipPreflight: false,
      commitment: "confirmed",
    }
  );

  const program = new anchor.Program<Firethree>(
    IDL as Firethree,
    "CMDqkbpJ6L4US5FXSFB23hwQGtPJAQrKqvBf2kaJN8BD",
    provider
  );

  anchor.setProvider(provider);

  it("Should able to create a project", async () => {
    const name = encodeName("Slide v5");

    const [ProjectPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(name)],
      program.programId
    );

    await program.methods
      .setupProject({
        name,
        shdw: new PublicKey("HjJQdfTHgC3EBX3471w4st8BXbBmtbaMyCAXNgcUb7dq"),
      })
      .accounts({
        user: provider.wallet.publicKey,
        project: ProjectPDA,
      })
      .rpc();

    const firethree = await program.account.project.fetch(ProjectPDA);

    console.log("On-chain data is:", firethree);

    expect(decodeName(firethree.name)).equal(decodeName(name));
  });

  it("Should able to get a project", async () => {
    const name = encodeName("Slide v5");

    const [ProjectPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(name)],
      program.programId
    );

    const firethree = await program.account.project.fetch(ProjectPDA);

    console.log("On-chain data is:", firethree);

    expect(decodeName(firethree.name)).equal(decodeName(name));
  });
});
