import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "../utils/abi.json";
import SmartAccount from "@biconomy/smart-account";

import { Network, Alchemy } from 'alchemy-sdk';

const settings = {
    apiKey: "5japsVsp7IA6yhDg0VoXzKH4XAkM6rhw",
    network: Network.MATIC_MUMBAI,
};
const alchemy = new Alchemy(settings);

// Listen to all new pending transactions
// alchemy.ws.on(
//     { method: "alchemy_pendingTransactions",
//     fromAddress: "0xshah.eth" },
//     (res) => console.log(res)
// );

interface Props {
    smartAccount: SmartAccount
    provider: any
    acct: any
  }

const Minter:React.FC<Props> = ({ smartAccount, provider, acct}) => {
    const [nftCount, setNFTCount] = useState<number>(0);
    const nftAddress = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;

    const nftContract = new ethers.Contract(nftAddress, abi, provider);

    useEffect(() => {
        getNFTCount()
    },[])

    const getNFTCount = async () => {
        const nfts = await alchemy.nft.getNftsForOwner(smartAccount.address);
        console.log(nfts);
        setNFTCount(nfts.totalCount);
    }

    const mintNFT = async () => {
        try {
            const mintTx = await nftContract.populateTransaction.mint()
            const tx1 = {
            to: nftAddress,
            data: mintTx.data,
            }
            const txResponse = await smartAccount.sendTransaction({ transaction: tx1})

            const txHash = await txResponse.wait();
            console.log({txHash})
            console.log({txResponse})
            getNFTCount()
        } catch (error) {
            console.log(error)
        }
    }

    const mintMultipleNFT = async () => {
        try {
            const mintTx = await nftContract.populateTransaction.mint()
            const tx1 = {
            to: nftAddress,
            data: mintTx.data,
            }
            const tx2 = {
                to: nftAddress,
                data: mintTx.data,
                }
            const txResponse = await smartAccount.sendTransactionBatch({ transactions: [tx1, tx2]})

            const txHash = await txResponse.wait();
            console.log({txHash})
            console.log({txResponse})
            getNFTCount()
        } catch (error) {
            console.log(error)
        }
    }

    const nftURL = `https://testnets.opensea.io/${smartAccount.address}`

    return(
        <div>
            <button onClick={() => mintNFT()}>Mint One</button>
            <button onClick={() => mintMultipleNFT()}>Mint Two</button>
            {nftCount ? (<p>You own {nftCount} tickets </p>): null}
            {nftCount ? (<p>View your NFTs <a href={nftURL} target="_blank">here</a> </p>): null}
        </div>
    )
};

export default Minter;

