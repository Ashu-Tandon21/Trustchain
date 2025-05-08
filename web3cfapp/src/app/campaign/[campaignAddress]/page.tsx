'use client';
import { client } from "@/app/client";
import { TierCard } from "../../components/TierCard";
import { useParams } from "next/navigation";
import { useState } from "react";
import { getContract, prepareContractCall, ThirdwebContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { lightTheme, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";

export default function CampaignPage() {
    const account = useActiveAccount();
    const { campaignAddress } = useParams();
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const contract = getContract({
        client: client,
        chain: sepolia,
        address: campaignAddress as string,
    });

    // Name of the campaign
    const { data: name } = useReadContract({
        contract,
        method: "function name() view returns (string)",
        params: [],
    });

    // Description of the campaign
    const { data: description } = useReadContract({ 
        contract, 
        method: "function description() view returns (string)", 
        params: [] 
    });

    // Campaign deadline
    const { data: deadline } = useReadContract({
        contract,
        method: "function deadline() view returns (uint256)",
        params: [],
    });

    const deadlineDate = deadline ? new Date(Number(deadline) * 1000) : new Date();
    const hasDeadlinePassed = deadlineDate < new Date();

    // Goal amount
    const { data: goal } = useReadContract({
        contract,
        method: "function goal() view returns (uint256)",
        params: [],
    });

    // Funded balance
    const { data: balance } = useReadContract({
        contract,
        method: "function getContractBalance() view returns (uint256)",
        params: [],
    });

    // Safe percentage calculation
    const totalBalance = balance ? Number(balance) : 0;
    const totalGoal = goal ? Number(goal) : 1; // prevent divide by zero
    let balancePercentage = (totalBalance / totalGoal) * 100;
    if (balancePercentage > 100) balancePercentage = 100;

    // Tiers
    const { data: tiers, isLoading: isLoadingTiers } = useReadContract({
        contract,
        method: "function getTiers() view returns ((string name, uint256 amount, uint256 backers)[])",
        params: [],
    });

    // Owner
    const { data: owner } = useReadContract({
        contract,
        method: "function owner() view returns (address)",
        params: [],
    });

    // Status
    const { data: status } = useReadContract({ 
        contract, 
        method: "function state() view returns (uint8)", 
        params: [] 
    });

    return (
        <div className="mx-auto max-w-7xl px-2 mt-4 sm:px-6 lg:px-8">
            <div className="flex flex-row justify-between items-center">
                {name && (
                    <p className="text-4xl font-semibold">{name}</p>
                )}
                {owner === account?.address && (
                    <div className="flex flex-row">
                        {isEditing && (
                            <p className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2">
                                Status:  
                                {status === 0 ? " Active" : 
                                status === 1 ? " Successful" :
                                status === 2 ? " Failed" : "Unknown"}
                            </p>
                        )}
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-md"
                            onClick={() => setIsEditing(!isEditing)}
                        >{isEditing ? "Done" : "Edit"}</button>
                    </div>
                )}
            </div>

            <div className="my-4">
                <p className="text-lg font-semibold">Description:</p>
                <p>{description}</p>
            </div>

            <div className="mb-4">
                <p className="text-lg font-semibold">Deadline</p>
                <p>{deadlineDate.toDateString()}</p>
            </div>

            <div className="mb-4">
                <p className="text-lg font-semibold">Campaign Goal: ${goal?.toString()}</p>
                <div className="relative w-full h-6 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                    <div
                        className="h-6 bg-blue-600 rounded-full text-right transition-all duration-700 ease-out"
                        style={{ width: `${balancePercentage}%` }}
                    >
                        <p className="text-white text-xs p-1">${balance?.toString()}</p>
                    </div>
                    <p className="absolute top-0 right-0 text-white text-xs p-1">
                        {balancePercentage >= 100 ? "" : `${Math.floor(balancePercentage)}%`}
                    </p>
                </div>
            </div>

            <div>
                <p className="text-lg font-semibold">Tiers:</p>
                <div className="grid grid-cols-3 gap-4">
                    {isLoadingTiers ? (
                        <p>Loading...</p>
                    ) : (
                        tiers && tiers.length > 0 ? (
                            tiers.map((tier, index) => (
                                <TierCard
                                    key={index}
                                    tier={tier}
                                    index={index}
                                    contract={contract}
                                    isEditing={isEditing}
                                />
                            ))
                        ) : (
                            !isEditing && (
                                <p>No tiers available</p>
                            )
                        )
                    )}
                    {isEditing && (
                        <button
                            className="max-w-sm flex flex-col text-center justify-center items-center font-semibold p-6 bg-blue-500 text-white border border-slate-100 rounded-lg shadow"
                            onClick={() => setIsModalOpen(true)}
                        >+ Add Tier</button>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <CreateCampaignModal
                    setIsModalOpen={setIsModalOpen}
                    contract={contract}
                />
            )}
        </div>
    );
}

type CreateTierModalProps = {
    setIsModalOpen: (value: boolean) => void
    contract: ThirdwebContract
}

const CreateCampaignModal = (
    { setIsModalOpen, contract }: CreateTierModalProps
  ) => {
    const [tierName, setTierName] = useState<string>("");
    const [tierAmount, setTierAmount] = useState<bigint>(1n);
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center backdrop-blur-md">
        <div className="w-1/2 bg-white p-6 rounded-md text-black">
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg font-semibold">Create a Funding Tier</p>
            <button
              className="text-sm px-4 py-2 bg-slate-600 text-white rounded-md"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="flex flex-col text-black">
            <label className="mb-1 text-black">Tier Name:</label>
            <input
              type="text"
              value={tierName}
              onChange={(e) => setTierName(e.target.value)}
              placeholder="Tier Name"
              className="mb-4 px-4 py-2 bg-white border border-gray-300 rounded-md text-black placeholder:text-gray-600"
            />
            <label className="mb-1 text-black">Tier Cost:</label>
            <input
              type="number"
              value={Number(tierAmount)}
              onChange={(e) => setTierAmount(BigInt(e.target.value))}
              className="mb-4 px-4 py-2 bg-white border border-gray-300 rounded-md text-black placeholder:text-gray-600"
            />
            <TransactionButton
              transaction={() =>
                prepareContractCall({
                  contract,
                  method: "function addTier(string _name, uint256 _amount)",
                  params: [tierName, tierAmount],
                })
              }
              onTransactionConfirmed={async () => {
                alert("Tier added successfully!");
                setIsModalOpen(false);
              }}
              onError={(error) => alert(`Error: ${error.message}`)}
            >
              Add Tier
            </TransactionButton>
          </div>
        </div>
      </div>
    );
  };
  
  
  



