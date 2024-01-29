import { PublicKey } from '@solana/web3.js'

export type Project = {
  name: string
  ts: number
  publicKey?: PublicKey
  image?: string
  bump: number
  shdw: PublicKey
  authority: PublicKey
}
