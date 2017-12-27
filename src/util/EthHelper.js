/* global web3 */
/* eslint-disable class-methods-use-this */
import { LIKE_MEDIA_ABI, LIKE_MEDIA_ADDRESS } from '@/constant/contract/likemedia';
import { LIKE_COIN_ABI, LIKE_COIN_ADDRESS } from '@/constant/contract/likecoin';

const Eth = require('ethjs');
const EthContract = require('ethjs-contract');
const randomhex = require('randomhex');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class EthHelper {

  initApp(errCb, clearErrCb) {
    const eth = new Eth(new Eth.HttpProvider('https://rinkeby.infura.io'));
    this.startApp(eth);
    this.errCb = errCb;
    this.clearErrCb = clearErrCb;
    setTimeout(() => this.pollForWeb3(), 1000);
  }

  pollForWeb3() {
    if (typeof web3 !== 'undefined') {
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
      web3.version.getNetwork((err, netId) => {
        if (netId === '4') {
          const eth = new Eth(web3.currentProvider);
          this.clearErrCb();
          this.startApp(eth);
          this.isMetaMask = true;
        } else {
          this.errCb('testnet');
          this.retryTimer = setTimeout(() => this.pollForWeb3(), 3000);
        }
      });
    } else {
      this.errCb('web3');
      this.retryTimer = setTimeout(() => this.pollForWeb3(), 3000);
    }
  }

  startApp(eth) {
    this.eth = eth;
    let contract = new EthContract(eth);
    const LikeMediaContract = contract(LIKE_MEDIA_ABI);
    this.likeMediaContract = LikeMediaContract.at(LIKE_MEDIA_ADDRESS);
    contract = new EthContract(eth);
    const LikeCoinContract = contract(LIKE_COIN_ABI);
    this.likeCoinContract = LikeCoinContract.at(LIKE_COIN_ADDRESS);
    this.getAccounts(eth);
  }

  getAccounts(eth) {
    eth.accounts().then((accounts) => {
      if (accounts && accounts[0]) {
        this.accounts = accounts;
        this.wallet = accounts[0];
        this.clearErrCb();
      } else {
        if (this.isMetaMask) this.errCb('locked');
        this.retryTimer = setTimeout(() => this.getAccounts(eth), 3000);
      }
    });
  }

  async waitForTxToBeMined(txHash, cb) {
    let txReceipt;
    while (!txReceipt) {
      try {
        /* eslint-disable no-await-in-loop */
        await timeout(1000);
        txReceipt = await this.eth.getTransactionReceipt(txHash);
      } catch (err) {
        console.log(`ERROR: ${err}`);
        if (cb) cb(err);
      }
    }
    console.log('YES');
    if (cb) cb();
  }

  onClick(format, pre, cb) {
    if (!this.likeMediaContract) return;
    const { id, author, wallet, description, license, footprints, ipfs } = format;
    const footprintsArray = JSON.parse(footprints);
    const footprintKeys = footprintsArray.map(f => f.id);
    const footprintValues = footprintsArray.map(f => f.share);
    this.likeMediaContract.upload(
      id,
      author,
      description,
      wallet,
      ipfs,
      footprintKeys,
      footprintValues,
      license,
      { from: this.accounts[0], gas: 900000, data: '0x' },
    )
    .then((txHash) => {
      if (pre) pre();
      console.log('Transaction sent');
      console.dir(txHash);
      this.waitForTxToBeMined(txHash, cb);
    })
    .catch(console.error);
  }

  onClickGet(uid) {
    if (!this.likeMediaContract) return;
    this.likeMediaContract.get(uid)
    .then((info) => {
      console.dir(info);
    })
    .catch(console.error);
  }

  getWallet() {
    return this.wallet;
  }

  queryLikeCoinBalance(addr) {
    if (!addr) return '';
    return this.likeCoinContract.balanceOf(addr);
  }

  queryLikeCount(key) {
    if (!key) return '0';
    return this.likeMediaContract.getLike(key);
  }

  /* copy and paste for now, clean up later */
  prettifyNumber(n) {
    const s = n.toString(10);
    let start = 0;
    let until = ((s.length + 2) % 3) + 1;
    const arr = [];
    while (start < s.length) {
      arr.push(s.substr(start, until - start));
      start = until;
      until += 3;
    }
    return arr.join(' ');
  }

  async genTypedSignData(from, value) {
    let nonce;
    let result = true;
    do {
      nonce = randomhex(32);
      result = (await this.likeCoinContract.usedNonce(from, nonce));
    } while (result && result[0]);
    return [
      { type: 'address', name: 'contract', value: LIKE_COIN_ADDRESS },
      { type: 'string', name: 'method', value: 'approveDelegated' },
      { type: 'address', name: 'spender', value: LIKE_MEDIA_ADDRESS },
      { type: 'uint256', name: 'value', value: this.prettifyNumber(value) },
      { type: 'uint256', name: 'nonce', value: nonce },
    ];
  }

  sendAsync(obj) {
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync(obj, (err, result) => {
        if (err) {
          reject(err);
        } else if (result.error) {
          reject(result.error);
        } else {
          resolve(result.result || result);
        }
      });
    });
  }

  async signTyped(signData, from) {
    try {
      const result = await this.sendAsync({
        method: 'eth_signTypedData',
        params: [signData, from],
        from,
      });
      return result;
    } catch (err) {
      console.error(err);
    }
    return '';
  }

  async signTransferDelegated(key, value) {
    if (!this.isMetaMask) return Promise.reject(new Error('No MetaMask'));
    const from = this.getWallet();
    const signData = (await this.genTypedSignData(from, value));
    const nonce = signData.filter(param => param.name === 'nonce')[0].value;
    const rawSignature = (await this.signTyped(signData, from)).substr(2);
    if (!rawSignature) return Promise.reject(new Error('Signing Rejected'));
    const r = `0x${rawSignature.substr(0, 64)}`;
    const s = `0x${rawSignature.substr(64, 64)}`;
    const v = Number.parseInt(rawSignature.substr(128, 2), 16);
    const postData = {
      key,
      from,
      value: value.toString(10),
      nonce,
      r,
      s,
      v,
    };
    return Promise.resolve(postData);
  }
  /* copy and paste end */

}
export default new EthHelper();
