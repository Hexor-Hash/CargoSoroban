import { connectWallet, getWalletAddress, isFreighterInstalled } from '../../lib/wallet';

// Mock @stellar/freighter-api
jest.mock('@stellar/freighter-api', () => ({
  isConnected: jest.fn(),
  getPublicKey: jest.fn(),
  requestAccess: jest.fn(),
  signTransaction: jest.fn(),
}));

import { isConnected, getPublicKey, requestAccess } from '@stellar/freighter-api';

const mockIsConnected  = isConnected  as jest.Mock;
const mockGetPublicKey = getPublicKey as jest.Mock;
const mockRequestAccess = requestAccess as jest.Mock;

const TEST_ADDRESS = 'GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('isFreighterInstalled', () => {
  it('returns true when Freighter is connected', async () => {
    mockIsConnected.mockResolvedValueOnce({ isConnected: true });
    expect(await isFreighterInstalled()).toBe(true);
  });

  it('returns false when Freighter is not connected', async () => {
    mockIsConnected.mockResolvedValueOnce({ isConnected: false });
    expect(await isFreighterInstalled()).toBe(false);
  });

  it('returns false when isConnected throws', async () => {
    mockIsConnected.mockRejectedValueOnce(new Error('not installed'));
    expect(await isFreighterInstalled()).toBe(false);
  });
});

describe('connectWallet', () => {
  it('returns the public key when Freighter is installed and access granted', async () => {
    mockIsConnected.mockResolvedValueOnce({ isConnected: true });
    mockRequestAccess.mockResolvedValueOnce({ error: undefined });
    mockGetPublicKey.mockResolvedValueOnce({ publicKey: TEST_ADDRESS, error: undefined });

    const address = await connectWallet();
    expect(address).toBe(TEST_ADDRESS);
  });

  it('throws when Freighter is not installed', async () => {
    mockIsConnected.mockResolvedValueOnce({ isConnected: false });
    await expect(connectWallet()).rejects.toThrow('Freighter wallet not installed');
  });

  it('throws when requestAccess returns an error', async () => {
    mockIsConnected.mockResolvedValueOnce({ isConnected: true });
    mockRequestAccess.mockResolvedValueOnce({ error: 'User rejected' });
    await expect(connectWallet()).rejects.toThrow('User rejected');
  });
});

describe('getWalletAddress', () => {
  it('returns the public key when connected', async () => {
    mockIsConnected.mockResolvedValueOnce({ isConnected: true });
    mockGetPublicKey.mockResolvedValueOnce({ publicKey: TEST_ADDRESS, error: undefined });

    const address = await getWalletAddress();
    expect(address).toBe(TEST_ADDRESS);
  });

  it('returns null when not connected', async () => {
    mockIsConnected.mockResolvedValueOnce({ isConnected: false });
    const address = await getWalletAddress();
    expect(address).toBeNull();
  });

  it('returns null when getPublicKey returns an error', async () => {
    mockIsConnected.mockResolvedValueOnce({ isConnected: true });
    mockGetPublicKey.mockResolvedValueOnce({ error: 'No key', publicKey: '' });
    const address = await getWalletAddress();
    expect(address).toBeNull();
  });
});
