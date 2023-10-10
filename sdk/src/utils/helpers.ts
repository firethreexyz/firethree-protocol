import { PublicKey } from '@solana/web3.js'
import { encodeName } from './name'

export const getProjectPDA = (projectName: string, programId: PublicKey) => {
  const [ProjectPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('project'), Buffer.from(encodeName(projectName))],
    programId
  )

  return ProjectPDA
}
