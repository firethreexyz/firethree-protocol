import { ShdwDrive } from '@shadow-drive/sdk'

const shadowVerifyAccount = (shdwDrive: ShdwDrive, shdw: string) => {
  if (!shdwDrive) throw new Error('Genesys Shadow Drive not initialized')

  if (!shdw)
    throw new Error('Project does not have a shdw drive associated')
}

export default shadowVerifyAccount
