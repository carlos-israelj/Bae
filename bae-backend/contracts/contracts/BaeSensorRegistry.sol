// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract BaeSensorRegistry {
    
    struct SensorData {
        string deviceId;
        bytes ciphertext;
        bytes nonce;
        bytes signature;
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    // Array simple en lugar de mapping
    SensorData[] public allReadings;
    
    // Contador simple
    uint256 public totalReadings;
    
    event SensorDataSubmitted(string indexed deviceId, uint256 timestamp, uint256 blockNumber, uint256 index);
    
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
        uint256 index = allReadings.length - 1;
        totalReadings++;
        
        emit SensorDataSubmitted(deviceId, timestamp, block.number, index);
    }
    
    function getLatestReading() 
        external 
        view 
        returns (SensorData memory) 
    {
        require(allReadings.length > 0, "No readings");
        return allReadings[allReadings.length - 1];
    }
    
    function getReading(uint256 index)
        external
        view
        returns (SensorData memory)
    {
        require(index < allReadings.length, "Invalid index");
        return allReadings[index];
    }
    
    function getReadingCount() 
        external 
        view 
        returns (uint256) 
    {
        return allReadings.length;
    }
    
    function getLastNReadings(uint256 n)
        external
        view
        returns (SensorData[] memory)
    {
        uint256 count = allReadings.length;
        uint256 size = count < n ? count : n;
        
        SensorData[] memory results = new SensorData[](size);
        uint256 start = count > n ? count - n : 0;
        
        for (uint256 i = 0; i < size; i++) {
            results[i] = allReadings[start + i];
        }
        
        return results;
    }
}
