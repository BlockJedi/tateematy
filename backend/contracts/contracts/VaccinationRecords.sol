// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VaccinationRecords
 * @dev Smart contract for storing and managing vaccination records on the blockchain
 * @dev Only authorized healthcare providers can record vaccinations
 * @dev Parents and authorized parties can verify vaccination records
 */
contract VaccinationRecords is Ownable, Pausable {
    
    // Structs
    struct VaccinationRecord {
        string childId;           // Child identifier (can be hashed later for privacy)
        string vaccineName;       // Name of the vaccine (e.g., "DTaP", "IPV")
        uint8 doseNumber;         // Dose number (1, 2, 3, etc.)
        uint256 dateGiven;        // Timestamp when vaccine was administered
        address doctorAddress;    // Address of the healthcare provider
        string hospitalId;        // Hospital or clinic identifier
        string batchNumber;       // Vaccine batch number for traceability
        uint256 expiryDate;       // Vaccine expiry date
        uint256 timestamp;        // When record was created on blockchain
        bool isValid;             // Record validity status
        string ipfsHash;          // IPFS hash for additional data (optional)
    }
    
    // State variables
    mapping(bytes32 => VaccinationRecord) public vaccinationRecords;
    mapping(string => bytes32[]) public childVaccinationHistory;
    
    // Counters
    uint256 public totalVaccinationRecords;
    
    // Events
    event VaccinationRecorded(
        bytes32 indexed recordHash,
        string indexed childId,
        string vaccineName,
        uint8 doseNumber,
        address indexed recordedBy,
        uint256 timestamp,
        string ipfsHash
    );
    
    event RecordUpdated(
        bytes32 indexed recordHash,
        string childId,
        string vaccineName,
        uint8 doseNumber,
        uint256 timestamp
    );
    
    event RecordInvalidated(
        bytes32 indexed recordHash,
        address indexed invalidatedBy,
        uint256 timestamp,
        string reason
    );
    
    
    modifier recordExists(bytes32 recordHash) {
        require(vaccinationRecords[recordHash].timestamp != 0, "Vaccination record does not exist");
        _;
    }
    
    // Constructor
    constructor() Ownable(msg.sender) {
        totalVaccinationRecords = 0;
    }
    
    /**
     * @dev Record a new vaccination
     * @param childId Child identifier
     * @param vaccineName Name of the vaccine
     * @param doseNumber Dose number
     * @param dateGiven Date when vaccine was given
     * @param hospitalId Hospital identifier
     * @param batchNumber Vaccine batch number
     * @param expiryDate Vaccine expiry date
     * @param ipfsHash IPFS hash for additional data (optional)
     */
    function recordVaccination(
        string memory childId,
        string memory vaccineName,
        uint8 doseNumber,
        uint256 dateGiven,
        string memory hospitalId,
        string memory batchNumber,
        uint256 expiryDate,
        string memory ipfsHash
    ) external onlyOwner {
        require(bytes(childId).length > 0, "Child ID cannot be empty");
        require(bytes(vaccineName).length > 0, "Vaccine name cannot be empty");
        require(doseNumber > 0, "Dose number must be greater than 0");
        require(dateGiven <= block.timestamp, "Date given cannot be in the future");
        require(expiryDate > block.timestamp, "Vaccine must not be expired");
        
        // Generate unique record hash
        bytes32 recordHash = keccak256(
            abi.encodePacked(
                childId,
                vaccineName,
                doseNumber,
                dateGiven,
                msg.sender,
                block.timestamp
            )
        );
        
        // Check if record already exists
        require(vaccinationRecords[recordHash].timestamp == 0, "Vaccination record already exists");
        
        // Create vaccination record
        VaccinationRecord memory newRecord = VaccinationRecord({
            childId: childId,
            vaccineName: vaccineName,
            doseNumber: doseNumber,
            dateGiven: dateGiven,
            doctorAddress: msg.sender, // This will be the owner's address
            hospitalId: hospitalId,
            batchNumber: batchNumber,
            expiryDate: expiryDate,
            timestamp: block.timestamp,
            isValid: true,
            ipfsHash: ipfsHash
        });
        
        // Store the record
        vaccinationRecords[recordHash] = newRecord;
        
        // Update child's vaccination history
        childVaccinationHistory[childId].push(recordHash);
        
        // Update counter
        totalVaccinationRecords++;
        
        // Emit event
        emit VaccinationRecorded(
            recordHash,
            childId,
            vaccineName,
            doseNumber,
            msg.sender,
            block.timestamp,
            ipfsHash
        );
    }
    
    /**
     * @dev Get vaccination record by hash
     * @param recordHash Hash of the vaccination record
     * @return Vaccination record details
     */
    function getVaccinationRecord(bytes32 recordHash) 
        external view recordExists(recordHash) 
        returns (VaccinationRecord memory) {
        return vaccinationRecords[recordHash];
    }
    
    /**
     * @dev Get all vaccination records for a child
     * @param childId Child identifier
     * @return Array of record hashes
     */
    function getChildVaccinationHistory(string memory childId) 
        external view returns (bytes32[] memory) {
        return childVaccinationHistory[childId];
    }
    

    
    /**
     * @dev Update vaccination record (only for corrections)
     * @param recordHash Hash of the record to update
     * @param newDateGiven New date given
     * @param newBatchNumber New batch number
     * @param newExpiryDate New expiry date
     * @param newIpfsHash New IPFS hash
     */
    function updateVaccinationRecord(
        bytes32 recordHash,
        uint256 newDateGiven,
        string memory newBatchNumber,
        uint256 newExpiryDate,
        string memory newIpfsHash
    ) external onlyOwner recordExists(recordHash) {
        VaccinationRecord storage record = vaccinationRecords[recordHash];
        
        // Only allow updates within 24 hours of recording
        require(block.timestamp - record.timestamp <= 24 hours, "Can only update records within 24 hours");
        
        // Validate new data
        require(newDateGiven <= block.timestamp, "Date given cannot be in the future");
        require(newExpiryDate > block.timestamp, "Vaccine must not be expired");
        
        // Update record
        record.dateGiven = newDateGiven;
        record.batchNumber = newBatchNumber;
        record.expiryDate = newExpiryDate;
        record.ipfsHash = newIpfsHash;
        
        emit RecordUpdated(
            recordHash,
            record.childId,
            record.vaccineName,
            record.doseNumber,
            block.timestamp
        );
    }
    
    /**
     * @dev Invalidate a vaccination record (emergency use only)
     * @param recordHash Hash of the record to invalidate
     * @param reason Reason for invalidation
     */
    function invalidateRecord(bytes32 recordHash, string memory reason) 
        external onlyOwner recordExists(recordHash) {
        require(vaccinationRecords[recordHash].isValid, "Record is already invalid");
        
        vaccinationRecords[recordHash].isValid = false;
        
        emit RecordInvalidated(recordHash, msg.sender, block.timestamp, reason);
    }
    

    function getContractStats() external view returns (
        uint256 totalRecords,
        uint256 contractBalance
    ) {
        return (totalVaccinationRecords, address(this).balance);
    }
    
    /**
     * @dev Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Emergency unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw contract balance (emergency use only)
     */
    function withdrawBalance() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Receive function to accept ETH (if needed)
     */
    receive() external payable {}
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {}
}
