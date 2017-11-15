<template>
  <div class="view">
    <md-layout md-gutter>
      <md-tabs md-right class="md-transparent" @change="onTabChange">
        <md-tab md-label="Latest" />
        <md-tab md-label="Original" />
        <md-tab md-label="Meme" />
        <md-tab md-label="ALL" />
      </md-tabs>
      <md-layout v-if="!isGraph">
        <md-layout md-align="center" md-flex-xsmall="100" md-flex-small="50" md-flex-medium="33" md-flex="25"
         class="image-view" v-for="(ipfs, id) in vList" :key="id">
          <router-link :to="{ name: 'ViewImage', params: { uid: ipfs.id }}">
            <md-ipfs-image :ipfsSrc="ipfs.ipfs" />
          </router-link>
        </md-layout>
      </md-layout>
      <md-layout v-else md-flex="100"><d3-svg :list="completeList" /></md-layout>
    </md-layout>
  </div>
</template>

<script>
import * as api from '@/api/api';
import { LIKE_MEDIA_ABI, LIKE_MEDIA_ADDRESS, RINKEBY_ID } from '@/constant/contract/likemedia';
import MdIpfsImage from './MdIpfsImage';
import D3ViewAll from './D3ViewAll';

const abi = require('web3-eth-abi');

const LIST_SIZE = 16;

export default {
  name: 'ViewList',
  data() {
    return {
      vList: [],
      isGraph: false,
      completeList: [],
    };
  },
  components: {
    'md-ipfs-image': MdIpfsImage,
    'd3-svg': D3ViewAll,
  },
  computed: {
    newList() {
      const decodeList = this.completeList;
      return decodeList.slice(decodeList.length - LIST_SIZE, decodeList.length).reverse();
    },
    originalList() {
      const list = this.completeList.filter(v => v.isOriginal);
      return list.slice(list.length - LIST_SIZE, list.length).reverse();
    },
    memeList() {
      const list = this.completeList.filter(v => !v.isOriginal);
      return list.slice(list.length - LIST_SIZE, list.length).reverse();
    },
  },
  methods: {
    refreshList(eventObj, signature) {
      const data = {
        jsonrpc: '2.0',
        method: 'eth_getLogs',
        params: [{
          fromBlock: '0x1',
          toBlock: 'latest',
          address: LIKE_MEDIA_ADDRESS,
          topics: [`${signature}`],
        }],
        id: Math.floor(Math.random() * 100000) + 10,
      };
      api.apiPostRinkeby(RINKEBY_ID, data).then((response) => {
        // get body data
        const decodeList = response.data.result.map((r) => {
          const decode = abi.decodeLog(eventObj.inputs, r.data, r.topics);
          const isOriginal = !(decode.footprintKeys && decode.footprintKeys.length > 0);
          return {
            id: r.topics[1],
            ipfs: decode.ipfs,
            description: decode.description,
            isOriginal,
            parent: isOriginal ? '' : decode.footprintKeys[0],
          };
        });
        this.completeList = decodeList; // .slice(decodeList.length - 100, decodeList.length);
        this.vList = this.newList;
      })
      .catch((response) => {
        // error callback
        console.log(response);
      });
    },
    onTabChange(index) {
      this.isGraph = (index === 3);
      if (index === 0) this.vList = this.newList;
      else if (index === 1) this.vList = this.originalList;
      else if (index === 2) this.vList = this.memeList;
    },
  },
  mounted() {
    const eventObj = LIKE_MEDIA_ABI.find(obj => (obj.type === 'event' && obj.name === 'Uploaded'));
    const signature = abi.encodeEventSignature(eventObj);
    this.refreshList(eventObj, signature);
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
