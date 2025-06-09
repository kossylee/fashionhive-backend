import { Injectable } from '@nestjs/common';
import { RpcProvider, Account, Contract } from 'starknet';

@Injectable()
export class StarknetService {
  private provider: RpcProvider;
  private contract: Contract | null = null;

  constructor() {
    // Use StarkNet testnet provider
    this.provider = new RpcProvider({
      nodeUrl: 'https://rpc-goerli.starknet.io'
    });
  }

  async connectContract(contractAddress: string, abi: any) {
    this.contract = new Contract(abi, contractAddress, this.provider);
  }

  async verifyProofOnChain(proof: any, publicSignals: any): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not connected');
    // Example: call Cairo contract method to verify proof
    // Replace 'verify_proof' and args with your actual contract method
    const res = await this.contract.invoke('verify_proof', [proof, publicSignals]);
    // invoke only returns transaction_hash, not result
    return !!res.transaction_hash;
  }
}
