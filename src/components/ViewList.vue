<template>
  <div class="view">
    <md-layout md-gutter>
      <md-tabs md-right class="md-transparent" @change="onTabChange">
        <md-tab md-label="GraphView" />
        <md-tab md-label="Latest" />
        <md-tab md-label="Original" />
        <md-tab md-label="Meme!" />
      </md-tabs>
      <md-layout v-if="!isGraph">
        <md-layout md-align="center" md-flex-xsmall="100" md-flex-small="50" md-flex-medium="33" md-flex="25"
         class="image-view" v-for="(ipfs, id) in vList" :key="id">
          <router-link :to="{ name: 'ViewImage', params: { uid: ipfs.id }}">
            <md-ipfs-image :ipfsSrc="ipfs.ipfs" />
          </router-link>
        </md-layout>
      </md-layout>
      <md-layout v-else md-flex="100"><svg width="1920" height="1920">
        <g style="transform: translate(500px, 500px)">
          <clipPath id="cicleClipPath">
            <circle r="40"/>
          </clipPath>
          <transition-group tag="g" name="line" >
            <path v-for="link in links" class="link" v-bind:key="link.id" v-bind:d="link.d" v-bind:style="link.style"></path>
          </transition-group>
          <transition-group tag="g" name="list">
          <g class="node" v-for="node in renderNodes" v-bind:key="node.id" v-bind:style="node.style" v-bind:class="[node.className, {'highlight': node.highlight}]">
            <a :href="'/#/view/'+node.text">
            <circle v-bind:r="node.r" v-bind:style="'#bfbfbf'"></circle>
            <image v-if="node.ipfs" :href="'https://meme.like.community/ipfs/'+node.ipfs" clip-path="url(#cicleClipPath)"
             height="100" width="100" x="-50" y="-50" /></a>
          </g>
        </transition-group>
        </g>
      </svg></md-layout>
    </md-layout>
  </div>
</template>

<script>
import * as d3 from 'd3';

import * as api from '@/api/api';
import { LIKE_MEDIA_ABI, LIKE_MEDIA_ADDRESS, RINKEBY_ID } from '@/constant/contract/likemedia';
import MdIpfsImage from './MdIpfsImage';

const abi = require('web3-eth-abi');

const LIST_SIZE = 16;

function radialPoint(x, y) {
  return [y * Math.cos(x - (Math.PI / 2)), y * Math.sin(x - (Math.PI / 2))];
}

export default {
  name: 'ViewList',
  data() {
    return {
      vList: [],
      nodes: [],
      isGraph: false,
      root: null,
      completeList: [],
    };
  },
  components: {
    'md-ipfs-image': MdIpfsImage,
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
    renderNodes() {
      if (this.nodes) {
        return this.nodes.map((d) => {
          const [x, y] = radialPoint(d.x, d.y);
          const transform = `translate(${x}px, ${y}px)`;
          return {
            id: d.id,
            ipfs: d.data.ipfs,
            r: 2.5,
            text: d.id,
            style: {
              transform,
            },
            textpos: {
              x: d.children ? -8 : 8,
              y: 3,
            },
            textStyle: {
              textAnchor: 'start',
            },
          };
        });
      }
      return [];
    },
    links() {
      if (this.root) {
        return this.root.links().map((d) => {
          const l = d3.linkRadial()
                     .angle(i => i.x)
                     .radius(i => i.y)(d);
          return {
            id: d.source.id + d.target.id,
            d: l,
            style: {
              stroke: '#ff0000',
            },
          };
        });
      }
      return [];
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
            isOriginal,
            parent: isOriginal ? '' : decode.footprintKeys[0],
          };
        });
        this.completeList = decodeList; // .slice(decodeList.length - 100, decodeList.length);
        this.root = d3.stratify()
                      .id(i => i.id)
                      .parentId((i) => {
                        if (i.parent === 'root') return '';
                        if (i.parent === '') return 'root';
                        return i.parent;
                      })([...decodeList, { id: 'root', parentId: 'root' }]);
        const tree = d3.tree()
                     .size([2 * Math.PI, 500])
                     .separation((a, b) => (a.parent === b.parent ? 2 : 3) / a.depth)(this.root);
        this.nodes = tree.descendants();
        this.vList = this.newList;
      })
      .catch((response) => {
        // error callback
        console.log(response);
      });
    },
    onTabChange(index) {
      this.isGraph = (index === 0);
      if (index === 1) this.vList = this.newList;
      else if (index === 2) this.vList = this.originalList;
      else if (index === 3) this.vList = this.memeList;
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

.link {
  fill: none;
  stroke: #555;
  stroke-opacity: 0.4;
  stroke-width: 1.5px;
  stroke-dasharray: 1000;
}

</style>
