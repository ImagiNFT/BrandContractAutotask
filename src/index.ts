import { RelayerParams} from 'defender-relay-client/lib/relayer';
import { DefenderRelayProvider , DefenderRelaySigner} from 'defender-relay-client/lib/ethers';
import { ethers } from "ethers"
import * as contract from "../contracts/NFTContract.json"


const { abi, address:contractAddress } = contract;

export async function main(signer : ethers.Signer, contractAddress: string, abi: any) {
  // Create contract instance from the relayer signer
  const NFTContract = new ethers.Contract(contractAddress, abi, signer);

  // Check relayer balance via the Defender network provider
  //const relayer = await signer.getAddress();
  const seedFromSC = await NFTContract.merkleSeed();
  const seedFromApiResponse = await fetch("https://rewards-fawn.vercel.app/api/whitelist/1");
  const data = await seedFromApiResponse.json();
  const {merkleSeed} = data;
  const hexMerkleSeed = `0x${merkleSeed}`;
  console.log({hexMerkleSeed, seedFromSC});
  // Send funds to recipient if non zero
  if (hexMerkleSeed !== seedFromSC) {
    const tx = await NFTContract.setSeed(hexMerkleSeed);
    console.log(`Set New Merkle Seed: '0x${merkleSeed}`);
    return tx;
  } else {
    console.log(`Same Merkle Seed: ${merkleSeed}`);
  }
}
// Entrypoint for the Autotask
export async function handler(credentials: RelayerParams) {
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
  return exports.main(signer, contractAddress, abi);
}

// Sample typescript type definitions
type EnvInfo = {
  API_KEY: string;
  API_SECRET: string;
}

// To run locally (this code will not be executed in Autotasks)
if (require.main === module) {
  require('dotenv').config();
  const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env as EnvInfo;
  handler({ apiKey, apiSecret })
    .then(() => process.exit(0))
    .catch((error: Error) => { console.error(error); process.exit(1); });
}
