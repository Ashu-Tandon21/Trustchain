import { client } from "@/app/client";
import Link from "next/link";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { useReadContract } from "thirdweb/react";

type CampaignCardProps = {
    campaignAddress: string;
};

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaignAddress }) => {
    const contract = getContract({
        client: client,
        chain: sepolia,
        address: campaignAddress,
    });

    const { data: campaignName } = useReadContract({
        contract: contract,
        method: "function name() view returns (string)",
        params: []
    });

    const { data: campaignDescription } = useReadContract({
        contract: contract,
        method: "function description() view returns (string)",
        params: []
    });

    const { data: goal } = useReadContract({
        contract: contract,
        method: "function goal() view returns (uint256)",
        params: [],
    });

    const { data: balance } = useReadContract({
        contract: contract,
        method: "function getContractBalance() view returns (uint256)",
        params: [],
    });

    // Helper: Convert wei to ETH
    const weiToEth = (wei: string | undefined) => {
        if (!wei) return 0;
        return parseFloat(wei) / 1e18;
    };

    const balanceEth = weiToEth(balance?.toString());
    const goalUsd = goal ? parseFloat(goal.toString()) : 0;

    // Example ETH price in USD (hardcoded for now)
    const ethPriceUsd = 3000;

    // Balance in USD
    const balanceUsd = balanceEth * ethPriceUsd;

    // % funded
    const balancePercentage = goalUsd > 0 ? Math.min((balanceUsd / goalUsd) * 100, 100) : 0;

    return (
        <div className="flex flex-col justify-between max-w-sm p-6 bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div>
                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                        <div
                            className="bg-green-500 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${balancePercentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-sm mt-2 text-gray-700 font-medium">
                        <span>{balanceEth.toFixed(4)} ETH</span>
                        <span>{balancePercentage.toFixed(2)}%</span>
                    </div>
                </div>

                {/* Title */}
                <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">
                    {campaignName || "Loading..."}
                </h5>

                {/* Description */}
                <p className="mb-3 font-normal text-gray-600">
                    {campaignDescription || "No description available."}
                </p>

                {/* Target Goal in USD */}
                <p className="mb-5 text-sm text-gray-500 font-medium">
                    🎯 Target: <span className="text-gray-700">${goalUsd}</span> USD
                </p>
            </div>

            {/* Button */}
            <Link href={`/campaign/${campaignAddress}`} passHref={true}>
                <p className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300">
                    View Campaign
                    <svg
                        className="rtl:rotate-180 w-4 h-4 ms-2"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 10"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M1 5h12m0 0L9 1m4 4L9 9"
                        />
                    </svg>
                </p>
            </Link>
        </div>
    );
};
