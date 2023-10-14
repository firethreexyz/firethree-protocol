import { ShdwDrive } from '@shadow-drive/sdk'
import { PublicKey } from '@solana/web3.js'

const shadowVerifyAccount = (
  shdwDrive: ShdwDrive,
  shdw: string | PublicKey
) => {
  if (!shdwDrive) throw new Error('Genesys Shadow Drive not initialized')

  if (!shdw) throw new Error('Project does not have a shdw drive associated')
}

export default shadowVerifyAccount
