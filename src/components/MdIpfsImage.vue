<template>
  <md-image :md-src="ipfsUrl" />
</template>

<script>
import axios from 'axios';
import IPFS_HOST from '@/api/ipfsHost';

export default {
  name: 'MdIpfsImage',
  props: {
    ipfsSrc: String,
  },
  data() {
    return {
      ipfsHost: 'https://ipfs.io/ipfs',
    };
  },
  computed: {
    ipfsUrl() {
      return `${this.ipfsHost}/${this.ipfsSrc}`;
    },
  },
  methods: {
    pingForIPFSHost(hash) {
      Promise.race([
        axios.head(`https://ipfs.io/ipfs/${hash}`),
        new Promise(resolve => setTimeout(resolve, 1000))
        .then(() => axios.head(`${IPFS_HOST}/${hash}`)),
      ])
      .then((res) => {
        this.ipfsHost = res.request.responseURL.replace(hash, '');
        console.log(`WINNER: ${this.ipfsHost}`);
      })
      .catch((err) => {
        console.log(err);
      });
    },
  },
  watch: {
    ipfsSrc() {
      this.pingForIPFSHost(this.ipfsSrc);
    },
  },
  mounted() {
    this.pingForIPFSHost(this.ipfsSrc);
  },
};

</script>
