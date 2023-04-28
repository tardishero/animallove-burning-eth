/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";

import {
  BURNCONTRACTADDR,
  DAWGSCONTRACTADDR,
  DAWGSIMGIPFSADDRESS,
  DAWGSIPFSADDRESS,
} from "../config";

import Card from "../components/Card";
import ParentCard from "../components/ParentCard";
import {
  errorAlert,
  infoAlert,
  successAlert,
  warningAlert,
} from "../components/toastGroup";
import { ScaleLoader } from "react-spinners";

import BURNCONTRACTABI from "../../public/abi/BURNCONTRACTABI.json";
import NFTCONTRACTABI from "../../public/abi/NFTCONTRACTABI.json";

interface NFTType {
  name: string;
  tokenId: number;
  imgUrl: string;
}

interface PARENTNFTType {
  maleTokenId: number;
  feMaleTokenId: number;
  maleImgUrl: string;
  feMaleImgUrl: string;
  startedTime: number;
  breedAllow: boolean;
  owner: string;
}

interface WindowWithEthereum extends Window {
  ethereum?: any;
}

const Home: NextPage = () => {
  const { account } = useWeb3React();
  const [maleList, setMaleList] = useState<NFTType[]>([]);
  const [femaleList, setFemmaleList] = useState<NFTType[]>([]);
  const [parentList, setParentList] = useState<PARENTNFTType[]>([]);

  const [selectedMale, setSelectedMale] = useState<NFTType[] | undefined>();
  const [selectedFemale, setSelectedFemale] = useState<NFTType[] | undefined>();

  const [nftApproveAllState, setNftApproveAllState] = useState<boolean>(false);
  const [startLoadingState, setStartLoadingState] = useState<boolean>(false);

  const provider =
    typeof window !== "undefined" && (window as WindowWithEthereum).ethereum
      ? new ethers.providers.Web3Provider(
          (window as WindowWithEthereum).ethereum
        )
      : null;
  const Signer = provider?.getSigner();

  const NFTCONTRACT = new ethers.Contract(
    DAWGSCONTRACTADDR,
    NFTCONTRACTABI,
    Signer
  );

  const BURNCONTRACT = new ethers.Contract(
    BURNCONTRACTADDR,
    BURNCONTRACTABI,
    Signer
  );

  const getNFTList = async () => {
    let maleArray: NFTType[] = [];
    let femaleArray: NFTType[] = [];

    await NFTCONTRACT.walletOfOwner(account).then(async (data: NFTType[]) => {
      console.log(data);
      for (let i = 0; i < data.length; i++) {
        try {
          const response = await fetch(
            DAWGSIPFSADDRESS + "/" + data[i] + `.json`,
            {
              method: "GET",
            }
          );
          const responsedata = await response.json();
          console.log(
            "responsedata.attributes[1].trait_type ",
            responsedata.attributes[1].trait_type
          );

          responsedata.attributes[1].value === "Male"
            ? maleArray.push({
                name: responsedata.name,
                tokenId: Number(data[i]),
                imgUrl: DAWGSIMGIPFSADDRESS + Number(data[i]) + ".png",
              })
            : femaleArray.push({
                name: responsedata.name,
                tokenId: Number(data[i]),
                imgUrl: DAWGSIMGIPFSADDRESS + Number(data[i]) + ".png",
              });
        } catch (error) {
          console.error("Unable to fetch data:", error);
        }
      }
    });
    setMaleList(maleArray);
    setFemmaleList(femaleArray);
  };

  const getApprovedAllState = async () => {
    const state = await NFTCONTRACT.isApprovedForAll(account, BURNCONTRACTADDR);
    console.log("state", state);
    setNftApproveAllState(state);
  };

  useEffect(() => {
    if (account) {
      getNFTList();
      getApprovedAllState();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const handleBurnFunc = async () => {
    setStartLoadingState(true);
    if (!nftApproveAllState) {
      await NFTCONTRACT.setApprovalForAll(BURNCONTRACTADDR, true).then(
        (tx: any) => {
          tx.wait()
            .then(() => {
              if (selectedFemale) {
                BURNCONTRACT.burn(selectedFemale[0]?.tokenId)
                  .then((tx: any) => {
                    tx.wait().then(() => {
                      successAlert("Burned successful.");
                      getNFTList();
                      setStartLoadingState(false);
                    });
                  })
                  .catch(() => {
                    errorAlert("Burned error.");
                    getNFTList();
                    setStartLoadingState(false);
                  });
              }
            })
            .catch(() => {
              errorAlert("Burned error.");
              getNFTList();
              setStartLoadingState(false);
            });
        }
      );
    } else {
      if (selectedFemale) {
        await BURNCONTRACT.burn(selectedFemale[0]?.tokenId)
          .then((tx: any) => {
            tx.wait()
              .then(() => {
                successAlert("Burned successful.");
                getNFTList();
                setStartLoadingState(false);
              })
              .catch(() => {
                errorAlert("Burned error.");
                getNFTList();
                setStartLoadingState(false);
              });
          })
          .catch(() => {
            errorAlert("Burned error.");
            getNFTList();
            setStartLoadingState(false);
          });
      }
    }
  };

  const handleBurnAllFunc = async () => {
    setStartLoadingState(true);
    if (!nftApproveAllState) {
      await NFTCONTRACT.setApprovalForAll(BURNCONTRACTADDR, true).then(
        (tx: any) => {
          tx.wait()
            .then(() => {
              BURNCONTRACT.burnAll()
                .then((tx: any) => {
                  tx.wait().then(() => {
                    successAlert("Burned successful.");
                    getNFTList();
                    setStartLoadingState(false);
                  });
                })
                .catch(() => {
                  errorAlert("Burned error.");
                  getNFTList();
                  setStartLoadingState(false);
                });
            })
            .catch(() => {
              errorAlert("Burned error.");
              getNFTList();
              setStartLoadingState(false);
            });
        }
      );
    } else {
      await BURNCONTRACT.burnAll()
        .then((tx: any) => {
          tx.wait()
            .then(() => {
              successAlert("Burned successful.");
              getNFTList();
              setStartLoadingState(false);
            })
            .catch(() => {
              errorAlert("Burned error.");
              getNFTList();
              setStartLoadingState(false);
            });
        })
        .catch(() => {
          errorAlert("Burned error.");
          getNFTList();
          setStartLoadingState(false);
        });
    }
  };

  return (
    <main className="container flex flex-col items-center justify-center w-full min-h-screen lg:px-[100px] md:px-[30px] px-5">
      <div
        className="relative z-[48] min-h-[80vh] bg-white bg-opacity-10 backdrop-blur-sm mt-[100px] w-full rounded-lg my-10 border-2 border-gray-800
      border-opacity-5"
      >
        <img
          src="/img/banner.png"
          className="object-cover object-center w-full rounded-t-lg md:h-[300px] h-[200px]"
        />
        <div className="flex items-center justify-center w-full -mt-10">
          <img
            src="/img/dogAvatar.png"
            className="w-[80px] h-[80px] object-cover rounded-full"
          />
        </div>
        <div className="grid w-full gap-5 px-2 mt-5 md:px-10 md:grid-cols-2">
          <div className="border-gray-400 p-5 border-[1px] rounded-md min-h-[45vh]">
            <p className="text-3xl font-bold text-center text-white">Male</p>
            {maleList.length !== 0 ? (
              <div className="w-full grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-2 max-h-[400px] overflow-y-auto">
                <>
                  {maleList.map((data, index) => (
                    <Card
                      name={data.name}
                      tokenId={data.tokenId}
                      imgUrl={data.imgUrl}
                      isUsed={parentList.some(
                        (item) =>
                          item.maleTokenId === data.tokenId ||
                          item.feMaleTokenId === data.tokenId
                      )}
                      selectedToken={selectedFemale}
                      onCardClick={() =>
                        setSelectedFemale([
                          {
                            name: data.name,
                            tokenId: data.tokenId,
                            imgUrl: data.imgUrl,
                          },
                        ])
                      }
                      key={index}
                    />
                  ))}{" "}
                </>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-gray-300 text-[30px] font-extrabold flex items-center justify-center">
                  Nothing to show
                </p>
              </div>
            )}
          </div>
          <div className="border-gray-400 p-5 border-[1px] rounded-md min-h-[45vh]">
            <p className="text-3xl font-bold text-center text-white">Female</p>
            {femaleList.length !== 0 ? (
              <div className="w-full grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-2 max-h-[400px] overflow-y-auto">
                <>
                  {femaleList.map((data, index) => (
                    <Card
                      name={data.name}
                      tokenId={data.tokenId}
                      imgUrl={data.imgUrl}
                      selectedToken={selectedFemale}
                      isUsed={parentList.some(
                        (item) =>
                          item.maleTokenId === data.tokenId ||
                          item.feMaleTokenId === data.tokenId
                      )}
                      onCardClick={() =>
                        setSelectedFemale([
                          {
                            name: data.name,
                            tokenId: data.tokenId,
                            imgUrl: data.imgUrl,
                          },
                        ])
                      }
                      key={index}
                    />
                  ))}{" "}
                </>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-gray-300 text-[30px] font-extrabold flex items-center justify-center">
                  Nothing to show
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="relative flex items-center justify-center w-full gap-3 my-7">
          <div className="relative">
            {!account && (
              <div className="absolute top-0 bottom-0 left-0 right-0 w-full bg-gray-700 rounded-lg bg-opacity-10 backdrop-blur-sm z-[50] cursor-not-allowed"></div>
            )}
            <button
              className="relative px-4 py-2 font-bold text-black transition-all duration-300 bg-white rounded-md hover:bg-gray-300"
              onClick={() => handleBurnFunc()}
            >
              Burn
            </button>
          </div>
          <div className="relative">
            {!account && (
              <div className="absolute top-0 bottom-0 left-0 right-0 w-full bg-gray-700 rounded-lg bg-opacity-10 backdrop-blur-sm z-[50] cursor-not-allowed"></div>
            )}
            <button
              className="relative px-4 py-2 font-bold text-black transition-all duration-300 bg-white rounded-md hover:bg-gray-300"
              onClick={() => {
                handleBurnAllFunc();
              }}
            >
              Burn All
            </button>
          </div>
        </div>
      </div>
      {startLoadingState && (
        <div className="fixed top-0 bottom-0 left-0 right-0 flex z-[50] backdrop-blur-lg justify-center items-center flex-col gap-4">
          <ScaleLoader color="white" />
          <p className="text-white">Burning ...</p>
        </div>
      )}
    </main>
  );
};

export default Home;
