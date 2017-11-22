<template>
  <div>
  <svg :width="windowWidth" :height="windowHeight"
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
        <g><line v-for="link in graph.links" class="link"
          :x1="coords[link.source.index].x"
          :y1="coords[link.source.index].y"
          :x2="coords[link.target.index].x"
          :y2="coords[link.target.index].y"></line></g>
        <g><g class="node" v-for="(node, i) in graph.nodes" v-bind:style="getNodeStyle(node)">
          <!-- <a :href="'/#/view/'+node.url" :xlink:href="'/#/view/'+node.url"> -->
          <title>{{ node.data.description }}</title>
<!--           <circle :r="`${nodeRadius}`"
            @mousedown="onMouseDown({x: $event.screenX, y: $event.screenY, node: node })" /> -->
          <image v-if="node.data.ipfs" :href="'https://meme.like.community/ipfs/'+node.data.ipfs" clip-path="url(#cicleClipPath)"
           :xlink:href="'https://meme.like.community/ipfs/'+node.data.ipfs"
            @mousedown="onMouseDown({x: $event.screenX, y: $event.screenY, node})"
           :height="`${nodeSize}`" :width="`${nodeSize}`" :x="`${-nodeRadius}`" :y="`${-nodeRadius}`" />
        </g></g>
    </g>
  </svg>
    <md-snackbar md-duration="60000" ref="snackbar">
      <span><a :href="'/#/view/'+(currentData.id === 'root' ? '' : currentData.id)">
      {{ currentData.description || '(empty)' }}</a> by {{ currentData.author }}</span>
    </md-snackbar>
  </div>
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
      windowWidth: 0,
      windowHeight: 0,
      nodeScale: 0.25,
      padding: 50,
      currentMove: null,
      currentData: {},
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
    bounds() {
      return {
        minX: Math.min(...this.graph.nodes.map(n => n.x)),
        maxX: Math.max(...this.graph.nodes.map(n => n.x)),
        minY: Math.min(...this.graph.nodes.map(n => n.y)),
        maxY: Math.max(...this.graph.nodes.map(n => n.y)),
      };
    },
    coords() {
      const padding = (2 * this.padding) + this.nodeRadius;
      const xScale = (this.windowWidth - padding) / (this.bounds.maxX - this.bounds.minX);
      const yScale = (this.windowHeight - padding) / (this.bounds.maxY - this.bounds.minY);
      return this.graph.nodes.map((node) => {
        if (node.cord && node.vx === 0 && node.vy === 0
          && !node.fx && !node.fy) {
          return node.cord;
        }
        const cord = {
          x: this.padding + ((node.x - this.bounds.minX) * xScale),
          y: this.padding + ((node.y - this.bounds.minY) * yScale),
        };
        // eslint-disable-next-line no-param-reassign
        node.cord = cord;
        return cord;
      });
    },
  },
  methods: {
    getNodeStyle(d) {
      return { transform: `translate(${parseInt(this.coords[d.index].x, 10)}px,
        ${parseInt(this.coords[d.index].y, 10)}px)` };
    },
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
    onMouseDown(e) {
      this.currentMove = e;
      if (this.currentMove.node !== this.currentData) {
        this.currentData = this.currentMove.node;
        if (!this.$refs.snackbar.active) {
          this.$refs.snackbar.close();
          this.$refs.snackbar.open();
        }
      }
    },
    drag(e) {
      if (this.currentMove) {
        this.currentMove.node.fx = this.currentMove.node.x -
         (((this.currentMove.x - e.screenX) * (this.bounds.maxX - this.bounds.minX))
          / (this.windowWidth - (2 * this.padding)));
        this.currentMove.node.fy = this.currentMove.node.y -
        (((this.currentMove.y - e.screenY) * (this.bounds.maxY - this.bounds.minY))
          / (this.windowHeight - (2 * this.padding)));
        this.currentMove.x = e.screenX;
        this.currentMove.y = e.screenY;
      }
    },
    drop() {
      if (this.currentMove) {
        delete this.currentMove.node.fx;
        delete this.currentMove.node.fy;
        this.currentMove = null;
        this.simulation.alpha(0.5);
        this.simulation.restart();
      }
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

