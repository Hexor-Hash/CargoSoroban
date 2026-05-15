import { Horizon, Keypair, TransactionBuilder, Networks, Operation, Asset } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

const server = new Horizon.Server(process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org');
const network = process.env.STELLAR_NETWORK === 'MAINNET' ? Networks.PUBLIC : Networks.TESTNET;

export async function loadAccount(address: string) {
  return server.loadAccount(address);
}

export async function getXLMBalance(address: string): Promise<string> {
  const account = await server.loadAccount(address);
  const xlm = account.balances.find((b: { asset_type: string }) => b.asset_type === 'native');
  return xlm ? (xlm as { balance: string }).balance : '0';
}

export function verifySignature(publicKey: string, message: string, signatureBase64: string): boolean {
  try {
    const keypair = Keypair.fromPublicKey(publicKey);
    return keypair.verify(Buffer.from(message), Buffer.from(signatureBase64, 'base64'));
  } catch {
    return false;
  }
}

export async function buildEscrowDepositTx(from: string, contractId: string, amount: string, jobId: number): Promise<string> {
  const account = await server.loadAccount(from);
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: network,
  })
    .addOperation(Operation.payment({
      destination: contractId,
      asset: Asset.native(),
      amount,
    }))
    .addMemo({ type: 'text', value: `job:${jobId}` } as never)
    .setTimeout(30)
    .build();
  return tx.toXDR();
}

export async function submitTransaction(xdr: string) {
  const { TransactionBuilder } = await import('@stellar/stellar-sdk');
  const tx = TransactionBuilder.fromXDR(xdr, network);
  return server.submitTransaction(tx as never);
}
