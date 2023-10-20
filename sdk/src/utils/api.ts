import axios from 'axios'
import { GENESYSGO_URL } from '../constants/storage'

const GENESYS_API = axios.create({
  baseURL: `${GENESYSGO_URL}`,
  params: {
    timestamp: Date.now()
  }
})

export default GENESYS_API
