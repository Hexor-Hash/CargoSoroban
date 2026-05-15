import {
  isConnected,
  getPublicKey,
  signTransaction,
  requestAccess,
} from '@stellar/freighter-api'

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const result = await isConnected()
    return result.isConnected
  } catch {
    return false
  }
}

export async function connectWallet(): Promise<string> {
  const installed = await isFreighterInstalled()
  if (!installed) throw new Error('Freighter wallet not installed. Please install the extension.')

  const accessResult = await requestAccess()
  if (accessResult.error) throw new Error(accessResult.error)

  const keyResult = await getPublicKey()
  if (keyResult.error) throw new Error(keyResult.error)

  return keyResult.publicKey
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const connected = await isConnected()
    if (!connected.isConnected) return null
    const result = await getPublicKey()
    return result.error ? null : result.publicKey
  } catch {
    return null
  }
}

export async function signTx(xdr: string, network: string): Promise<string> {
  const result = await signTransaction(xdr, { networkPassphrase: network })
  if (result.error) throw new Error(result.error)
  return result.signedTxXdr
}
