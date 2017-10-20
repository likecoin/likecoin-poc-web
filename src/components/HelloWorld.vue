<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <h2>Essential Links</h2>
    <ul>
      <li><a href="https://vuejs.org" target="_blank">Core Docs</a></li>
      <li><a href="https://forum.vuejs.org" target="_blank">Forum</a></li>
      <li><a href="https://chat.vuejs.org" target="_blank">Community Chat</a></li>
      <li><a href="https://twitter.com/vuejs" target="_blank">Twitter</a></li>
      <br>
      <li><a href="http://vuejs-templates.github.io/webpack/" target="_blank">Docs for This Template</a></li>
    </ul>
    <h2>Ecosystem</h2>
    <button @click='onClick'>click</button>
    <button @click='onClickGet'>get</button>
    <ul>
      <li><a href="http://router.vuejs.org/" target="_blank">vue-router</a></li>
      <li><a href="http://vuex.vuejs.org/" target="_blank">vuex</a></li>
      <li><a href="http://vue-loader.vuejs.org/" target="_blank">vue-loader</a></li>
      <li><a href="https://github.com/vuejs/awesome-vue" target="_blank">awesome-vue</a></li>
    </ul>
  </div>
</template>

<script>
import { LIKE_MEDIA_ABI, LIKE_MEDIA_ADDRESS } from '@/constant/contract/likemedia';

const Eth = require('ethjs');
const EthContract = require('ethjs-contract');

/* global web3 */

export default {
  name: 'HelloWorld',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
      eth: null,
      retryTimer: null,
      likeContract: null,
      accounts: [],
    };
  },
  methods: {
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
    },
    startApp(eth) {
      this.eth = eth;
      const contract = new EthContract(eth);
      eth.accounts().then((accounts) => {
        this.accounts = accounts;
        const LikeContract = contract(LIKE_MEDIA_ABI);
        this.likeContract = LikeContract.at(LIKE_MEDIA_ADDRESS, {
          from: accounts[0],
          gas: 300000,
        });
        console.log(this.eth);
      });
    },
    waitForTxToBeMined: async (eth, txHash) => {
      let txReceipt;
      while (!txReceipt) {
        try {
          /* eslint-disable no-await-in-loop */
          console.log(txHash);
          console.log(eth);
          txReceipt = await eth.getTransactionReceipt(txHash);
        } catch (err) {
          return console.log(`ERROR: ${err}`);
        }
      }
      return console.log('YES');
    },
    onClick() {
      if (!this.likeContract) return;
      const key = '0x4d61726b65745061792e696f206973206465706c6f79696e6720536d61727420';
      this.likeContract.upload(
        key,
        'Michael',
        'Test upload',
        '0x83D3F8effbf3924D34F51531ce57C97C9fA2E5CF',
        '0x4d61726b65745061792e696f206973206465706c6f79696e6720536d61727421',
        ['0x4d61726b65745061792e696f206973206465706c6f79696e6720536d61727421',
          '0x4d61726b65745061792e696f206973206465706c6f79696e6720536d61727422'],
        [20, 15],
        'CC-by',
        1508474956,
        { from: this.accounts[0], gas: 900000, data: '0x' },
      )
      .then((txHash) => {
        console.log('Transaction sent');
        console.dir(txHash);
        this.waitForTxToBeMined(this.eth, txHash);
      })
      .catch(console.error);
    },
    onClickGet() {
      if (!this.likeContract) return;
      this.likeContract.get(
        '0x4d61726b65745061792e696f206973206465706c6f79696e6720536d61727420',
        )
      .then((info) => {
        console.dir(info);
      })
      .catch(console.error);
    },
  },
  mounted() {
    this.initApp();
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
