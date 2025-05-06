// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract crowdfunding {
    string public name;            // name of campaign
    string public description;     // description of the campaign
    uint256 public goal;
    uint256 public deadline;
    address public owner;
    bool public paused;

    enum campaignState {Active,Successful,Failed } // they'll be returning  as unit8 0,1,2 respectively
    campaignState public state;

    struct Tier{
        string name;
        uint256 amount;
        uint256 backers;
    }
    struct Backer{
        uint256 totalContribution;
        mapping(uint256 => bool) fundedTiers;

    }
    
    Tier[] public tiers;

    mapping(address => Backer) public backers;

    modifier onlyOwner(){
        require(msg.sender == owner,"Only the owner can do this");
        _;
    }
    modifier campaignActive(){
        require(state == campaignState.Active, "Campaign is not active");
        _;
    }

    modifier notPaused(){
        require(!paused,"Campaign is paused");
        _;
    }

    constructor(
        address _owner,
        string memory _name,
        string memory _description,
        uint256 _goal,
        uint256 _days
    ) {
        name = _name;
        description = _description;
        goal = _goal;
        deadline = block.timestamp + (_days * 1 days);
        owner = _owner;
        state = campaignState.Active;
    }
    function checkState() internal {
        if(state == campaignState.Active){
            if(block.timestamp >= deadline){
                state = address(this).balance >= goal ? campaignState.Successful : campaignState.Failed ;
            }
            else{
                 state = address(this).balance >= goal ? campaignState.Successful : campaignState.Active ;
            
            }
        }
    }

    function fund(uint256 _tierindex) public payable campaignActive notPaused{
        
        require(_tierindex< tiers.length ,"Invalid Tier");
        require(block.timestamp < deadline, "Campaign has ended");
        require(msg.value == tiers[_tierindex].amount, "Incorrect amount");
        tiers[_tierindex].backers++;
        backers[msg.sender].totalContribution += msg.value;
        backers[msg.sender].fundedTiers[_tierindex] = true;

        checkState();
    }

    function withdraw() public onlyOwner {
        checkState();
         require(state == campaignState.Successful,"Cmapiagn is not at the goal yet" ) ;
            

        uint256 balance = address(this).balance;
        require(balance > 0, "Low Balance");
        payable(owner).transfer(balance);
    }

    function addTier(
        string memory _name,
        uint256 _amount
    ) public onlyOwner{
        require(_amount > 0,"Amount shouls be greate than 0 ");
        tiers.push(Tier(_name,_amount,0));

    }
    function removeTier(uint256 _index) public onlyOwner{
        require(_index < tiers.length , "Index is out of Bounds");
        tiers[_index] = tiers[tiers.length - 1];
        tiers.pop();
    }

    function getbalance() public view returns (uint256) {
        return address(this).balance;
    }

    function refund() public{
        checkState();
       // require(state == campaignState.Failed, "No Rfunds available ");
        uint256 amount = backers[msg.sender].totalContribution; // amount to be refunded
        require(amount > 0 , "Insufficient amount funded Cannot be refinded");
        backers[msg.sender].totalContribution = 0;
        payable(msg.sender).transfer(amount); // contribution refunded

    }

    function hasFundedTier(address _backer,uint256 _tierindex)public view returns (bool) {

        return backers[_backer].fundedTiers[_tierindex];

    }
    function getTiers() public view returns(Tier[] memory){
        return tiers;
    }

    function togglePause() public onlyOwner{
        paused = !paused;
    }

    function status()public view returns(campaignState){
        if(state==campaignState.Active && block.timestamp < deadline){
            return address(this).balance >= goal ? campaignState.Successful : campaignState.Failed;
        }
        return state ;
    }

    function extendDeadline(uint256 _daysAdd)public onlyOwner campaignActive{
        deadline += _daysAdd * 1 days;
    }

}
