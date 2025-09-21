// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MemoryPack is ERC721, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _cids;

    constructor() ERC721("MemoryPack", "MPACK") Ownable(msg.sender) {}

    function safeMint(address to, string memory cid) public onlyOwner {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _cids[tokenId] = cid;
        _safeMint(to, tokenId);
    }

    function tokenCID(uint256 tokenId) public view returns (string memory) {
        return _cids[tokenId];
    }
}
