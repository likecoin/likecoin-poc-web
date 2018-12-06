<template>
  <div class="view">
    <md-layout md-gutter>
      <md-tabs v-if="!showGraphOnly" md-right class="md-transparent" @change="onTabChange">
        <md-tab :md-active="!activeTab" md-label="Latest" />
        <md-tab :md-active="activeTab=='1'" md-label="Most Liked" /><!--
        <md-tab :md-active="activeTab=='2'" md-label="Original" />
        <md-tab :md-active="activeTab=='3'" md-label="Meme" /> -->
        <md-tab :md-active="activeTab=='2'" md-label="ALL" />
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
import { LIKE_MEDIA_ABI, LIKE_MEDIA_ADDRESS } from '@/constant/contract/likemedia';
import MdIpfsImage from './MdIpfsImage';
import D3ViewAll from './D3ViewAll';

const abi = require('web3-eth-abi');

const LIST_SIZE = 16;

export default {
  name: 'ViewList',
  props: {
    showGraphOnly: Boolean,
  },
  data() {
    return {
      activeTab: this.$route.query.c,
      vList: [],
      isGraph: false,
      completeList: [],
      sortedLikedList: [],
    };
  },
  components: {
    'md-ipfs-image': MdIpfsImage,
    'd3-svg': D3ViewAll,
  },
  computed: {
    newList() {
      const decodeList = this.completeList;
      const begin = Math.max(decodeList.length - LIST_SIZE, 0);
      return decodeList.slice(begin, decodeList.length).reverse();
    },
    originalList() {
      const list = this.completeList.filter(v => v.isOriginal);
      const begin = Math.max(list.length - LIST_SIZE, 0);
      return list.slice(begin, list.length).reverse();
    },
    memeList() {
      const list = this.completeList.filter(v => !v.isOriginal);
      const begin = Math.max(list.length - LIST_SIZE, 0);
      return list.slice(begin, list.length).reverse();
    },
    mostLikedList() {
      return this.sortedLikedList.slice(0, LIST_SIZE);
    },
  },
  methods: {
    refreshList() {
      const uploadEventObj = LIKE_MEDIA_ABI.find(obj => (obj.type === 'event' && obj.name === 'Uploaded'));
      const uploadSignature = abi.encodeEventSignature(uploadEventObj);
      const giveLikeEventObj = LIKE_MEDIA_ABI.find(obj => (obj.type === 'event' &&
        obj.name === 'GiveLike'));
      const giveLikeSignature = abi.encodeEventSignature(giveLikeEventObj);
      const data = {
        jsonrpc: '2.0',
        method: 'eth_getLogs',
        params: [{
          fromBlock: '0x1',
          toBlock: 'latest',
          address: LIKE_MEDIA_ADDRESS,
          topics: [[`${giveLikeSignature}`, `${uploadSignature}`]],
        }],
        id: Math.floor(Math.random() * 100000) + 10,
      };
      api.apiPostRinkeby(data).then((response) => {
        // get body data
        const decodeList = [];
        const likeCounts = {};
        response.data.result.map((r) => {
          // like counts
          if (r.topics.includes(giveLikeSignature)) {
            likeCounts[r.topics[1]] = likeCounts[r.topics[1]] ?
              likeCounts[r.topics[1]] + 1 : 1;
            return 0;
          }

          // get upload list
          const decode = abi.decodeLog(uploadEventObj.inputs, r.data, r.topics);
          const isOriginal = !(decode.footprintKeys && decode.footprintKeys.length > 0);
          decodeList.push(
            {
              id: r.topics[1],
              ipfs: decode.ipfs,
              author: decode.author,
              description: decode.description,
              isOriginal,
              parent: isOriginal ? '' : decode.footprintKeys[0],
            });
          return 0;
        });
        this.completeList = decodeList; // .slice(decodeList.length - 100, decodeList.length);
        this.vList = this.newList;
        this.sortedLikedList = decodeList.slice(0);
        this.sortedLikedList.sort((a, b) => likeCounts[b.id] - likeCounts[a.id]);
        if (this.activeTab) this.onTabChange(parseInt(this.activeTab, 10));
      })
      .catch((response) => {
        // error callback
        console.log(response);
      });
    },
    onTabChange(index) {
      this.isGraph = (index === 2);
      if (index === 0) this.vList = this.newList;
      else if (index === 1) this.vList = this.mostLikedList;
      // else if (index === 2) this.vList = this.originalList;
      // else if (index === 3) this.vList = this.memeList;
      this.$router.replace({ name: 'ViewList', query: { c: index } });
    },
  },
  mounted() {
    this.refreshList();
    if (this.showGraphOnly) this.isGraph = true;
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
