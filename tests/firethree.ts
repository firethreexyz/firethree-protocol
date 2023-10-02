
describe("Test", () => {
  it("initialize", async () => {
    // Send transaction

    const program = anchor.workspace.Firethree;
    const [ProjectPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(encodeName("Slide v2"))],
      program.programId
    );

    await pg.program.methods
      .setupProject({
        name: encodeName("Slide v2"),
      })
      .accounts({
        user: pg.wallet.publicKey,
        project: ProjectPDA,
      })
      .rpc({
        commitment: "confirmed",
      });

    const firethree = await program.account.project.fetch(ProjectPDA);

    console.log("On-chain data is:", firethree);

    // // Check whether the data on-chain is equal to local 'data'
    // assert(data.eq(newAccount.data));
  });
});

const MAX_NAME_LENGTH = 32;

function encodeName(name: string): number[] {
  if (name.length > MAX_NAME_LENGTH) {
    throw Error(`Name (${name}) longer than 32 characters`);
  }

  const buffer = Buffer.alloc(32);
  buffer.fill(name);
  buffer.fill(" ", name.length);

  return Array(...buffer);
}

function decodeName(bytes: number[]): string {
  const buffer = Buffer.from(bytes);
  return buffer.toString("utf8").trim();
}
