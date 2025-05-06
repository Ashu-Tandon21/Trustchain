// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import {crowdfunding} from "./funding.sol";

contract factoryFunding{
    address public owner;
    bool public paused;

    struct Campaign{
        address CampaignAddress;
        address owner;
        string name;
        uint256 creationTime;

    }

    Campaign[] public campaigns;
    mapping(address => Campaign[]) public userCampaigns;

    modifier onlyOwner(){
        require(msg.sender == owner , "Not Owner");
        _;
    }
    modifier notPaused(){
        require(!paused,"Factory is paused");
        _;
    }
    constructor(){
        owner = msg.sender;
    }

    function creatCampaign(
        string memory _name,
        string memory _description,
        uint256 _goal,
        uint256 _duration) external notPaused{
        crowdfunding newCampaign = new crowdfunding(owner,_name,_description,_goal,_duration);
        address campaignAddress = address(newCampaign);

        Campaign memory campaign = Campaign({
            CampaignAddress : campaignAddress,
            owner : msg.sender,
            name : _name,
            creationTime : block.timestamp

        });
        campaigns.push(campaign);


    }

    function getUserCampaign(address _user) external view returns(Campaign[] memory){
        return userCampaigns[_user];
    }

    function getAllCampaigns()external view returns(Campaign[] memory){
        return campaigns;
    }

    function togglePause()external onlyOwner{
        paused = !paused;
    }
    


}
