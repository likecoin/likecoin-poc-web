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
      <md-layout v-else md-flex="100"><svg :width="windowWidth" :height="renderRadius*2" :style="`height:${renderRadius*2}`">
        <g :style="`transform: translate(${Math.max(windowWidth/2, renderRadius)}px, ${renderRadius}px)`">
          <clipPath id="cicleClipPath">
            <circle :r="`${renderRadius/16}`"/>
          </clipPath>
          <radialGradient id="svg-gradient">
            <stop offset="0%"   stop-color="#a8ff97"/>
            <stop offset="30%"  stop-color="#69ecf1"/>
            <stop offset="51%"   stop-color="#77c9f5"/>
            <stop offset="77%"   stop-color="#b792ff"/>
            <stop offset="100%" stop-color="#fe7ba0"/>
          </radialGradient>
          <transition-group tag="g" name="line" >
            <path v-for="link in links" class="link" v-bind:key="link.id" v-bind:d="link.d" ></path>
          </transition-group>
          <transition-group tag="g" name="list">
          <g class="node" v-for="node in renderNodes" v-bind:key="node.id" v-bind:style="node.style">
            <a :href="'/#/view/'+node.url" :xlink:href="'/#/view/'+node.url">
            <title>{{ node.description }}</title>
            <image v-if="node.ipfs" :href="'https://meme.like.community/ipfs/'+node.ipfs" clip-path="url(#cicleClipPath)"
             :xlink:href="'https://meme.like.community/ipfs/'+node.ipfs"
             :height="`${renderRadius/7}`" :width="`${renderRadius/7}`" :x="`${-renderRadius/14}`" :y="`${-renderRadius/14}`" /></a>
          </g>
        </transition-group>
        </g>
      </svg></md-layout>
    </md-layout>
  </div>
</template>

<script>
import * as d3 from 'd3';
import * as _debounce from 'lodash.debounce';

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
      root: null,
      tree: null,
      vList: [],
      isGraph: false,
      completeList: [],
      windowWidth: 0,
      windowHeight: 0,
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
    renderRadius() {
      return this.windowWidth * 0.4;
    },
    nodes() {
      if (this.tree) return this.tree.descendants();
      return [];
    },
    renderNodes() {
      if (this.nodes) {
        return this.nodes.map((d) => {
          const [x, y] = radialPoint(d.x, d.y);
          const transform = `translate(${x}px, ${y}px)`;
          return {
            id: d.id,
            ipfs: d.data.ipfs,
            description: d.data.description,
            url: d.id === 'root' ? '' : d.id,
            style: {
              transform,
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
            description: decode.description,
            isOriginal,
            parent: isOriginal ? '' : decode.footprintKeys[0],
          };
        });
        this.completeList = decodeList; // .slice(decodeList.length - 100, decodeList.length);
        this.rerenderD3Tree();
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
    setWindowWidth() {
      this.windowWidth = document.documentElement.clientWidth;
    },
    setWindowHeight() {
      this.windowHeight = document.documentElement.clientHeight;
    },
    rerenderD3Tree() {
      const list = this.completeList;
      const root = d3.stratify()
                    .id(i => i.id)
                    .parentId((i) => {
                      if (i.parent === 'root') return '';
                      if (i.parent === '') return 'root';
                      return i.parent;
                    })([...list, { id: 'root', parentId: 'root', ipfs: 'QmXYnyfRQX2XdNz5mxj1sdJ58AbHYstwJVtUveazumCtCE' }]);
      const tree = d3.tree()
                   .size([2 * Math.PI, this.renderRadius])
                   .separation((a, b) => (a.parent === b.parent ? 2 : 3) / a.depth)(root);
      this.root = root;
      this.tree = tree;
    },
  },
  mounted() {
    const eventObj = LIKE_MEDIA_ABI.find(obj => (obj.type === 'event' && obj.name === 'Uploaded'));
    const signature = abi.encodeEventSignature(eventObj);
    this.refreshList(eventObj, signature);
    this.$nextTick(() => {
      window.addEventListener('resize', _debounce(this.setWindowWidth));
      window.addEventListener('resize', _debounce(this.setWindowHeight));
      this.setWindowWidth();
      this.setWindowHeight();
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', _debounce(this.setWindowWidth));
    window.removeEventListener('resize', _debounce(this.setWindowHeight));
  },
  watch: {
    renderRadius() {
      this.rerenderD3Tree();
    },
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
  stroke-opacity: 0.8;
  stroke: url(#svg-gradient);
  stroke-width: 1.5px;
  stroke-dasharray: 1000;
}

</style>
