// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MemoryPack is ERC721, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _cids;

    event PackCreated(uint256 indexed tokenId, address indexed owner, string cid);

    constructor() ERC721("MemoryPack", "MPACK") Ownable(msg.sender) {}

    function createPack(string memory cid, address[] calldata members) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        _cids[tokenId] = cid;

        emit PackCreated(tokenId, msg.sender, cid);

        // You could also save `members` in a mapping if needed
        return tokenId;
    }
    
    function cidOf(uint256 tokenId) external view returns (string memory) {
    ownerOf(tokenId); // ensures token exists
    return _cids[tokenId];
    }


}
