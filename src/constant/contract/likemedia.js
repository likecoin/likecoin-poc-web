/* eslint-disable */
export const LIKE_MEDIA_ABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "key",
        "type": "bytes32"
      },
      {
        "name": "index",
        "type": "uint8"
      }
    ],
    "name": "getFp",
    "outputs": [
      {
        "name": "k",
        "type": "bytes32"
      },
      {
        "name": "s",
        "type": "uint8"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "prevKey",
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "key",
        "type": "bytes32"
      }
    ],
    "name": "get",
    "outputs": [
      {
        "name": "k",
        "type": "bytes32"
      },
      {
        "name": "a",
        "type": "string"
      },
      {
        "name": "d",
        "type": "string"
      },
      {
        "name": "w",
        "type": "address"
      },
      {
        "name": "i",
        "type": "bytes"
      },
      {
        "name": "l",
        "type": "string"
      },
      {
        "name": "t",
        "type": "uint256"
      },
      {
        "name": "i2",
        "type": "bool"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "metaTables",
    "outputs": [
      {
        "name": "author",
        "type": "string"
      },
      {
        "name": "description",
        "type": "string"
      },
      {
        "name": "wallet",
        "type": "address"
      },
      {
        "name": "ipfs",
        "type": "bytes"
      },
      {
        "name": "license",
        "type": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "name": "isUsed",
        "type": "bool"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "key",
        "type": "bytes32"
      },
      {
        "name": "author",
        "type": "string"
      },
      {
        "name": "description",
        "type": "string"
      },
      {
        "name": "wallet",
        "type": "address"
      },
      {
        "name": "ipfs",
        "type": "bytes"
      },
      {
        "name": "footprintKeys",
        "type": "bytes32[]"
      },
      {
        "name": "footprintShares",
        "type": "uint8[]"
      },
      {
        "name": "license",
        "type": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "upload",
    "outputs": [],
    "payable": false,
    "type": "function"
  },
  {
    "inputs": [],
    "payable": false,
    "type": "constructor"
  }
];

export const LIKE_MEDIA_ADDRESS = '0x675661443b04849ca6ac992436a713e11cb0e161';
