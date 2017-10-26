/* global web3 */
import { LIKE_MEDIA_ABI, LIKE_MEDIA_ADDRESS } from '@/constant/contract/likemedia';

const Eth = require('ethjs');
const EthContract = require('ethjs-contract');

class EthHelper {

  initApp() {
    if (typeof web3 !== 'undefined') {
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
      const eth = new Eth(web3.currentProvider);
      this.startApp(eth);
    } else {
      /* if use testrpc instead */
      // const eth = new Eth(new Eth.HttpProvider('http://localhost:8545'));
      // this.startApp(eth);
      this.retryTimer = setTimeout(this.initApp, 3000);
    }
  }

  startApp(eth) {
    this.eth = eth;
    const contract = new EthContract(eth);
    eth.accounts().then((accounts) => {
      this.accounts = accounts;
      this.wallet = accounts[0];
      const LikeContract = contract(LIKE_MEDIA_ABI);
      this.likeContract = LikeContract.at(LIKE_MEDIA_ADDRESS, {
        from: accounts[0],
        gas: 300000,
      });
      console.log(this.eth);
    });
  }

  async waitForTxToBeMined(txHash, cb) {
    let txReceipt;
    while (!txReceipt) {
      try {
        /* eslint-disable no-await-in-loop */
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
    if (!this.likeContract) return;
    const { id, author, wallet, description, license, footprints, ipfs } = format;
    const footprintsArray = JSON.parse(footprints);
    const footprintKeys = footprintsArray.map(f => f.id);
    const footprintValues = footprintsArray.map(f => f.share);
    this.likeContract.upload(
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
    if (!this.likeContract) return;
    this.likeContract.get(uid)
    .then((info) => {
      console.dir(info);
    })
    .catch(console.error);
  }

  getWallet() {
    return this.wallet;
  }
}
export default new EthHelper();
