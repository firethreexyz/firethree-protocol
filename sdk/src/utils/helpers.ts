import { PublicKey } from '@solana/web3.js'

export const getProjectPDA = (projectName: string, programId: PublicKey) => {
  const [ProjectPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('project'), Buffer.from(projectName)],
    programId
  )

  return ProjectPDA
}
