// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HelloWorld
 * @notice Simple contract for testing XFI transactions with app_id attached
 * @dev Accepts any data via fallback function and logs it on-chain
 */
contract HelloWorld {
    
    // Track total interactions
    uint256 public totalInteractions;
    
    // Event emitted for every interaction
    event Interaction(
        address indexed sender,
        bytes data,
        uint256 amount,
        uint256 timestamp
    );
    
    /**
     * @notice Fallback function - accepts ANY raw data
     * @dev This is triggered when transaction has data but no matching function
     * The data field will contain the raw app_id hex
     */
    fallback() external payable {
        totalInteractions++;
        
        emit Interaction(
            msg.sender,
            msg.data,      // Raw app_id hex stored here
            msg.value,
            block.timestamp
        );
    }
    
    /**
     * @notice Receive function - accepts plain XFI without data
     */
    receive() external payable {
        totalInteractions++;
        
        emit Interaction(
            msg.sender,
            "",            // Empty data
            msg.value,
            block.timestamp
        );
    }
    
    /**
     * @notice Get contract balance
     * @return Contract XFI balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Withdraw accumulated XFI (anyone can call)
     * @dev In production, you'd restrict this to owner only
     */
    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}

