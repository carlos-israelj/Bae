// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

contract BaeSensorRegistry {
    
    struct SensorData {
        string deviceId;
        bytes ciphertext;
        bytes nonce;
        bytes signature;
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    SensorData[] public allReadings;
    uint256 public totalReadings;
    
    event SensorDataSubmitted(
        string indexed deviceId,
        uint256 timestamp,
        uint256 blockNumber,
        uint256 index
    );
    
    function submitSensorData(
        string memory deviceId,
        bytes memory ciphertext,
        bytes memory nonce,
        bytes memory signature,
        uint256 timestamp
    ) external {
        SensorData memory data = SensorData({
            deviceId: deviceId,
            ciphertext: ciphertext,
            nonce: nonce,
            signature: signature,
            timestamp: timestamp,
            blockNumber: block.number
        });
        
        allReadings.push(data);
        totalReadings++;
        
        emit SensorDataSubmitted(
            deviceId,
            timestamp,
            block.number,
            allReadings.length - 1
        );
    }
    
    function getLatestReading() 
        external 
        view 
        returns (SensorData memory) 
    {
        require(allReadings.length > 0, "No readings");
        return allReadings[allReadings.length - 1];
    }
    
    function getReadingCount() 
        external 
        view 
        returns (uint256) 
    {
        return allReadings.length;
    }
    
    function getReading(uint256 index)
        external
        view
        returns (SensorData memory)
    {
        require(index < allReadings.length, "Invalid index");
        return allReadings[index];
    }
}
