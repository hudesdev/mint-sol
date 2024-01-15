import { initializeKeypair } from "./initializeKeypair";
import { Connection, clusterApiUrl, PublicKey, Signer } from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
} from "@metaplex-foundation/js";
import * as fs from "fs";

interface NftData {
  name: string;
  symbol: string;
  description: string;
  sellerFeeBasisPoints: number;
  imageFile: string;
}

interface CollectionNftData {
  name: string;
  symbol: string;
  description: string;
  sellerFeeBasisPoints: number;
  imageFile: string;
  isCollection: boolean;
  collectionAuthority: Signer;
}

// // example data for a new NFT
// const nftData = {
//   name: "Name",
//   symbol: "SYMBOL",
//   description: "Description",
//   sellerFeeBasisPoints: 0,
//   imageFile: "solana.png",
// };

// example data for updating an existing NFT
const updateNftData = {
  name: "Update",
  symbol: "UPDATE",
  description: "Update Description",
  sellerFeeBasisPoints: 100,
  imageFile: "success.png",
};

async function uploadMetadata(metaplex: Metaplex, nftData: NftData) : Promise<string> {
  const buffer = fs.readFileSync("src/" + nftData.imageFile);
  const file = toMetaplexFile(buffer, "image.png");
  const imageUri = await metaplex.storage().upload(file);
  console.log("imageUri : ", imageUri);
  const {uri} = await metaplex.nfts().uploadMetadata({
    name: nftData.name,
    symbol: nftData.symbol,
    description: nftData.description,
    image : imageUri
  });
  console.log('metadata uri : ', uri)
  return uri
}

async function createNft(
  metaplex : Metaplex,
  uri : string,
  nftData : NftData
) : Promise<NftWithToken> {
  const {nft} = await metaplex.nfts().create({
    uri : uri, 
    name : nftData.name,
    symbol : nftData.symbol,
    sellerFeeBasisPoints : nftData.sellerFeeBasisPoints,
  }, {commitment : 'finalized'})
  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`,
  );

  return nft
}

async function updateNftUri(
  metaplex : Metaplex,
  uri : string,
  mintAddress : PublicKey
) {
  const nft = await metaplex.nfts().findByMint({
    mintAddress
  })
  const {response} = await metaplex.nfts().update({
    nftOrSft : nft,
    uri : uri
  }, {
    commitment : 'finalized'
  })
  console.log('nft structure :', nft)
  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`,
  );

  console.log(
      `Transaction: https://explorer.solana.com/tx/${response.signature}?cluster=devnet`,
  );
}

async function main() {
  // create a new connection to the cluster's API
  const connection = new Connection(clusterApiUrl("devnet"));

  // initialize a keypair for the user
  const user = await initializeKeypair(connection);

  console.log("PublicKey:", user.publicKey.toBase58());
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "hhtps://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );
  const nftData : NftData = {
    name : 'My NFT',
    symbol : 'Gakydo',
    description : 'This is my nft.',
    imageFile : 'image.png',
    sellerFeeBasisPoints : 0
  }
  console.log('upload Metadata....')
  // const uri = await uploadMetadata(metaplex, nftData)
  // const uri = await uploadMetadata(metaplex, updateNftData)
  const uri = 'https://arweave.net/TX-PDskRsMRDDFQxd0t2OlKtg4DPfCFxaDjvZ2KRtHU'
  // const nft = await createNft(metaplex, uri, nftData)
  await updateNftUri(metaplex, uri, new PublicKey('8AwHvqUmnV7FGAWM1h9BkuDUBmNYfYoxrjLEWANvi4d7'))
}

main()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
