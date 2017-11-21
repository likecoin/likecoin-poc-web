<template>
  <svg :width="windowWidth" :height="renderRadius*2"
       @mousemove="drag($event)"
       @mouseup="drop()">
    <g>
      <clipPath id="cicleClipPath">
        <circle :r="`${nodeRadius}`"/>
      </clipPath>
      <radialGradient id="svg-gradient">
        <stop offset="0%"   stop-color="#a8ff97"/>
        <stop offset="30%"  stop-color="#69ecf1"/>
        <stop offset="51%"   stop-color="#77c9f5"/>
        <stop offset="77%"   stop-color="#b792ff"/>
        <stop offset="100%" stop-color="#fe7ba0"/>
      </radialGradient>
        <line v-for="link in graph.links" class="link"
          :x1="coords[link.source.index].x"
          :y1="coords[link.source.index].y"
          :x2="coords[link.target.index].x"
          :y2="coords[link.target.index].y"></line>
        <g class="node" v-for="(node, i) in renderNodes" v-bind:style="node.style" >
          <!-- <a :href="'/#/view/'+node.url" :xlink:href="'/#/view/'+node.url"> -->
          <title>{{ node.description }}</title>
          <image v-if="node.ipfs" :href="'https://meme.like.community/ipfs/'+node.ipfs" clip-path="url(#cicleClipPath)"
           :xlink:href="'https://meme.like.community/ipfs/'+node.ipfs"
            @mousedown="currentMove = {x: $event.screenX, y: $event.screenY, node: node.dNode}"
           :height="`${nodeSize}`" :width="`${nodeSize}`" :x="`${-nodeRadius}`" :y="`${-nodeRadius}`" /></a>
        </g>
    </g>
  </svg>
</template>

<script>
import Vue from 'vue';
import * as d3 from 'd3';
// import * as panzoom from 'panzoom';
import * as _debounce from 'lodash.debounce';

export default {
  name: 'D3ViewAll',
  props: {
    list: Array,
  },
  data() {
    return {
      root: null,
      tree: null,
      graph: {
        nodes: null,
        links: null,
      },
      panzoom: null,
      windowWidth: 0,
      windowHeight: 0,
      nodeScale: 0.25,
      padding: 50,
      currentMove: null,
    };
  },
  computed: {
    renderRadius() {
      return this.windowWidth * 0.4;
    },
    nodeBase() {
      return Math.max(this.windowWidth, this.windowHeight) * this.nodeScale;
    },
    nodeSize() {
      return this.nodeBase / 7;
    },
    nodeRadius() {
      return this.nodeBase / 14;
    },
    renderNodes() {
      if (this.graph && this.graph.nodes) {
        return this.graph.nodes.map((d) => {
          const transform = `translate(${this.coords[d.index].x}px, ${this.coords[d.index].y}px)`;
          return {
            id: d.id,
            ipfs: d.data.ipfs,
            description: d.data.description,
            url: d.id === 'root' ? '' : d.id,
            style: {
              transform,
            },
            dNode: d,
          };
        });
      }
      return [];
    },
    bounds() {
      return {
        minX: Math.min(...this.graph.nodes.map(n => n.x)),
        maxX: Math.max(...this.graph.nodes.map(n => n.x)),
        minY: Math.min(...this.graph.nodes.map(n => n.y)),
        maxY: Math.max(...this.graph.nodes.map(n => n.y)),
      };
    },
    coords() {
      return this.graph.nodes.map((node) => {
        const padding = 2 * this.padding;
        return {
          x: this.padding + (((node.x - this.bounds.minX)
            * (this.windowWidth - padding)) / (this.bounds.maxX - this.bounds.minX)),
          y: this.padding + (((node.y - this.bounds.minY)
            * (this.windowHeight - padding)) / (this.bounds.maxY - this.bounds.minY)),
        };
      });
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
      Vue.set(this.graph, 'nodes', this.tree.descendants());
      Vue.set(this.graph, 'links', this.root.links());
      if (!this.simulation) {
        this.simulation = d3.forceSimulation(this.graph.nodes)
          .force('charge', d3.forceManyBody())
          .force('link', d3.forceLink(this.graph.links).distance(20).strength(1))
          .force('x', d3.forceX())
          .force('y', d3.forceY());
      }
    },
    drag(e) {
      if (this.currentMove) {
        console.log(e);
        this.currentMove.node.fx = this.currentMove.node.x -
         (((this.currentMove.x - e.screenX) * (this.bounds.maxX - this.bounds.minX))
          / (this.windowWidth - (2 * this.padding)));
        this.currentMove.node.fy = this.currentMove.node.y -
        (((this.currentMove.y - e.screenY) * (this.bounds.maxY - this.bounds.minY))
          / (this.windowHeight - (2 * this.padding)));
        console.log(this.currentMove.node.fx);
        console.log(this.currentMove.node.fy);
        this.currentMove.x = e.screenX;
        this.currentMove.y = e.screenY;
      }
    },
    drop() {
      if (this.currentMove) {
        delete this.currentMove.node.fx;
        delete this.currentMove.node.fy;
        this.currentMove = null;
      }
      this.simulation.alpha(1);
      this.simulation.restart();
    },
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', _debounce(this.setWindowWidth));
      window.addEventListener('resize', _debounce(this.setWindowHeight));
      document.body.addEventListener('zoom', () => {
        const trans = this.panzoom.getTransform();
        if (trans) this.nodeScale = Math.min(1, (1 / trans.scale));
      }, true);
      this.setWindowWidth();
      this.setWindowHeight();
      // this.panzoom = panzoom(this.$refs.graph);
      this.rerenderD3Tree();
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', _debounce(this.setWindowWidth));
    window.removeEventListener('resize', _debounce(this.setWindowHeight));
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

