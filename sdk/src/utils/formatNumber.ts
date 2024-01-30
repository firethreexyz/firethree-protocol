import BN from 'bn.js'

const formatNumber = (number: bigint | BN, decimals = 6) => {
  return Number(number.toString()) / 10 ** decimals
}

export default formatNumber
