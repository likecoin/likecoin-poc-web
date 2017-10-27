<template>
  <div class="view">
    <md-progress v-if="loading" md-indeterminate></md-progress>
    <md-layout md-gutter>
    <md-layout md-align="center"
      md-flex-xsmall="100" md-flex-small="100" md-flex-medium="100"
      md-flex-large="40"
      md-flex-xlarge="40" md-flex-offset-xlarge="5">
    <div class="image-view">
      <md-spinner v-if="!ipfsHash" md-indeterminate />
      <md-ipfs-image  v-else :ipfsSrc="imgUrl" />
    </div>
    <md-progress v-if="loading" md-indeterminate></md-progress>
    <div v-if="isMemeing"></div>
    </md-layout>
    <md-layout md-column md-gutter
      md-flex-xsmall="100" md-flex-small="100" md-flex-medium="100"
      md-flex-large = "60"
      md-flex="50">
    <md-card v-if="isMemeing">
    <md-card-content>
    <form id="imageMetadata" v-on:submit.prevent="onSubmit">
      <md-input-container class="md-input-invalid">
        <label>Bottom Meme Text</label>
        <md-textarea required placeholder=">PUT MEME HERE" v-model="memeText"></md-textarea>
      </md-input-container>
      <md-input-container>
        <label>Author</label>
        <md-input v-model="author"></md-input>
      </md-input-container>
      <md-input-container>
        <label>Author ETH wallet address</label>
        <md-input v-model="wallet"></md-input>
      </md-input-container>
      <md-input-container>
        <label>Description</label>
        <md-textarea v-model="description"></md-textarea>
      </md-input-container>
      <md-input-container>
        <label>License</label>
        <md-input v-model="license"></md-input>
      </md-input-container>
      <hr />
      <h2>Image parents</h2>
      <div>
        <md-input-container>
          <label>Parent content Fingerprint</label>
          <md-input disabled v-model="footprintId"></md-input>
        </md-input-container>
        <md-input-container>
          <label>Parent contribution %</label>
          <md-input v-model="footprintShare"></md-input>
        </md-input-container>
      </div>
      <md-button @click="isMemeing=false">Cancel</md-button>
      <md-button type="submit" form="imageMetadata">OK</md-button>
    </form>
    </md-card-content>
    </md-card>
    <md-table-card v-else>
      <md-table>
        <md-table-header>
          <md-table-row>
            <md-table-head>Metadata</md-table-head>
            <md-table-head></md-table-head>
          </md-table-row>
        </md-table-header>
        <md-table-body>
          <md-table-row  v-for="(value, key) in metadata" :key="key" v-if="!key.includes('footprint')">
            <md-table-cell>{{ key==='key'? 'Fingerprint': key }}</md-table-cell>
            <md-table-cell v-if="key==='timestamp'">{{ parseTimeStamp(value) }}</md-table-cell>
            <md-table-cell v-else>{{ value }}</md-table-cell>
          </md-table-row>
        </md-table-body>
      </md-table>
      <hr />
      <md-table v-if="footprints && footprints.length > 0">
        <md-table-header>
          <md-table-row>
            <md-table-head>Parent content Fingerprint</md-table-head>
            <md-table-head>Parent contribution %</md-table-head>
          </md-table-row>
        </md-table-header>
        <md-table-body>
          <md-table-row  v-for="(k, i) in footprints" :key="k">
            <md-table-cell><router-link :to="{ name: 'ViewImage', params: { uid: k }}"> {{ k }}</router-link></md-table-cell>
            <md-table-cell>{{ parseInt(footprintShares[i], 16) }}</md-table-cell>
          </md-table-row>
        </md-table-body>
      </md-table>
    </md-table-card>
    <span><md-button class="md-primary md-raised" v-if="!isMemeing" @click="isMemeing=true"> MEME! </md-button></span>
    </md-layout>
    </md-layout>
    <md-snackbar ref="snackbar">
      <span>Transaction pending. It usually takes less than a minute to process.</span>
    </md-snackbar>
  </div>
</template>

<script>
import moment from 'moment';

import * as api from '@/api/api';
import EthHelper from '@/util/EthHelper';
import MdIpfsImage from './MdIpfsImage';

export default {
  name: 'ViewImage',
  data() {
    return {
      uid: '',
      author: '',
      wallet: '',
      description: '',
      license: '',
      ipfsHash: '',
      metadata: {},
      footprintId: '',
      footprintShare: 50,
      isMemeing: false,
      memeText: '',
      loading: false,
    };
  },
  components: {
    'md-ipfs-image': MdIpfsImage,
  },
  computed: {
    imgUrl() {
      return `${this.ipfsHash}`;
    },
    footprints() {
      return this.metadata.footprintIds;
    },
    footprintShares() {
      return this.metadata.footprintShares;
    },
  },
  methods: {
    refreshImage(newUid) {
      const uid = newUid;
      if (!this.ipfsHash || this.uid !== uid) {
        api.apiGetMetadata(uid)
        .then((result) => {
          this.metadata = result.data;
          this.ipfsHash = result.data.ipfs;
          this.uid = uid;
          this.footprintId = uid;
        });
      }
    },
    parseTimeStamp(hex) {
      const t = new Date(parseInt(hex, 16) * 1000);
      return moment(t).format('YYYY-MM-DD HH:mm:ss');
    },
    getSerializedMetaData() {
      const { author, wallet, description, license, footprintId, footprintShare } = this;
      const footprints = [{ id: footprintId, share: footprintShare }];
      return {
        author,
        wallet,
        description,
        license,
        footprints: JSON.stringify(footprints),
      };
    },
    onSubmit() {
      this.loading = true;
      api.apiPostMeme(this.uid, this.memeText, this.getSerializedMetaData())
      .then((result) => {
        this.loading = false;
        EthHelper.onClick(
          result.data,
          () => {
            this.$refs.snackbar.open();
            this.loading = true;
          },
          (err) => {
            this.loading = false;
            if (err) return;
            this.$router.push({ name: 'ViewImage', params: { uid: result.data.id } });
            location.reload(); // refresh for better UX and less state problem
          },
        );
      });
    },
  },
  mounted() {
    this.refreshImage(this.$route.params.uid);
    if (!this.wallet) {
      setTimeout(() => {
        if (!this.wallet && EthHelper.getWallet()) {
          this.wallet = EthHelper.getWallet();
        }
      }, 3000);
    }
  },
  beforeRouteUpdate(to, from, next) {
    this.refreshImage(to.params.uid);
    next();
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
