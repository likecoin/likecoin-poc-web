<template>
  <svg :width="windowWidth" :height="renderRadius*2" :style="`height:${renderRadius*2}`">
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
  </svg>
</template>

<script>
import * as d3 from 'd3';
import * as _debounce from 'lodash.debounce';

function radialPoint(x, y) {
  return [y * Math.cos(x - (Math.PI / 2)), y * Math.sin(x - (Math.PI / 2))];
}

export default {
  name: 'D3ViewAll',
  props: {
    list: Array,
  },
  data() {
    return {
      root: null,
      tree: null,
      windowWidth: 0,
      windowHeight: 0,
    };
  },
  computed: {
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
    setWindowWidth() {
      this.windowWidth = document.documentElement.clientWidth;
    },
    setWindowHeight() {
      this.windowHeight = document.documentElement.clientHeight;
    },
    rerenderD3Tree() {
      const list = this.list;
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
.link {
  fill: none;
  stroke-opacity: 0.8;
  stroke: url(#svg-gradient);
  stroke-width: 1.5px;
  stroke-dasharray: 1000;
}
</style>

