<template>
  <div class="view">
    <md-layout md-gutter>
      <md-layout md-flex-xsmall="100" md-flex-small="50" md-flex-medium="33" md-flex-large="25" v-for="(ipfs, id) in vList" :key="id" :md-item="ipfs">
        <div class="image-view">
          <router-link :to="{ name: 'ViewImage', params: { uid: ipfs.id }}">
            <md-image :md-src="imgUrl(ipfs.ipfs)" />
          </router-link>
        </div>
      </md-layout>
    </md-layout>
  </div>
</template>

<script>
import * as api from '@/api/api';
import { LIKE_MEDIA_ABI, LIKE_MEDIA_ADDRESS, RINKEBY_ID } from '@/constant/contract/likemedia';

const abi = require('web3-eth-abi');

let eventObj = {};
for (let i = 0; i < LIKE_MEDIA_ABI.length; i += 1) {
  if (LIKE_MEDIA_ABI[i].type === 'event' && LIKE_MEDIA_ABI[i].name === 'Uploaded') {
    eventObj = LIKE_MEDIA_ABI[i];
    break;
  }
}
const signature = abi.encodeEventSignature(eventObj);
const params = `[{"fromBlock":"0x1","toBlock":"latest","address":"${LIKE_MEDIA_ADDRESS}","topics":["${signature}"]}]`;

export default {
  name: 'ViewList',
  data() {
    return {
      vList: [],
    };
  },
  methods: {
    refreshList() {
      const data = `{"jsonrpc":"2.0","method":"eth_getLogs","params":${params},"id":${Math.floor(Math.random() * 100000) + 10}}`;
      api.apiPostRinkeby(RINKEBY_ID, JSON.parse(data)).then((response) => {
        // get body data
        const decodeList = response.data.result.map((r) => {
          const decode = abi.decodeLog(eventObj.inputs, r.data, r.topics);
          return { id: r.topics[1], ipfs: decode.ipfs };
        });
        this.vList = decodeList.slice(decodeList.length - 10, decodeList.length);
      }, (response) => {
        // error callback
        console.log(response);
      });
    },
    imgUrl(ipfs) {
      return `https://ipfs.io/ipfs/${ipfs}`;
    },
  },
  mounted() {
    this.refreshList();
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

.image-view {
  padding: 5px 5px;
  margin: auto;
}

</style>
