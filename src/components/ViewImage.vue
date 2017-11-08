<template>
  <div class="view">
    <md-progress v-if="loading" :class="isInTransaction?'md-accent':''" md-indeterminate></md-progress>
    <md-layout md-gutter>
    <md-layout md-align="center" md-column
      md-flex-xsmall="100" md-flex-small="100"
      md-flex-medium="80" md-flex-offset-medium="10"
      md-flex-large="40"
      md-flex-xlarge="50">
      <div class="image-view">
        <md-spinner v-if="!ipfsHash" md-indeterminate />
        <md-ipfs-image  v-else :ipfsSrc="imgUrl" />
      </div>
    </md-layout>
    <md-layout md-column md-gutter
      md-flex-xsmall="100" md-flex-small="100" md-flex-medium="100"
      md-flex-large = "60"
      md-flex="50">
    <form v-if="isMemeing" id="imageMetadata" v-on:submit.prevent="onSubmit">
      <md-input-container md-flex="50" class="md-input-invalid">
        <label>Top Meme Text</label>
        <md-textarea placeholder=">PUT MEME HERE" v-model="topMemeText"></md-textarea>
      </md-input-container>
      <md-input-container md-flex="50" class="md-input-invalid">
        <label>Bottom Meme Text</label>
        <md-textarea placeholder=">PUT MEME HERE" v-model="memeText"></md-textarea>
      </md-input-container>
      <md-input-container>
        <label>Author</label>
        <md-input v-model="author" required></md-input>
      </md-input-container>
      <md-input-container :class="isBadAddress?'md-input-invalid':''">
        <label>Author ETH wallet address</label>
        <md-input v-model="wallet" maxlength="42" required />
        <span v-if="isBadAddress" class="md-error">Invalid address format</span>
      </md-input-container>
      <md-input-container>
        <label>Description</label>
        <md-textarea v-model="description"></md-textarea>
      </md-input-container>
      <md-input-container>
        <label>License</label>
        <md-input v-model="license" required></md-input>
      </md-input-container>
      <hr />
      <h2>Image parents</h2>
      <div>
        <md-input-container>
          <label>Parent content Fingerprint</label>
          <md-input disabled v-model="footprintId" required></md-input>
        </md-input-container>
        <md-input-container>
          <label>Parent contribution %</label>
          <md-input v-model="footprintShare" type="number" min="0" max="100" required></md-input>
        </md-input-container>
      </div>
      <md-button @click="isMemeing=false">Cancel</md-button>
      <md-button class="md-raised" type="submit" form="imageMetadata">OK</md-button>
    </form>
    <div class="metadatas" v-else>
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
    </div>
    <span><md-button class="md-primary md-raised" v-if="!isMemeing" @click="isMemeing=true"> MEME! </md-button></span>
    </md-layout>
    </md-layout>
    <md-snackbar md-duration="Infinity" ref="snackbar">
      <span>Transaction pending. It usually takes less than a minute to process.</span>
      <a v-if="txHash" :href="'https://rinkeby.etherscan.io/tx/'+txHash" target="_blank"> View on etherscan </a>
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
      wallet: EthHelper.getWallet() || '0x81f9b6c7129cee90fed5df241fa6dc4f88a19699',
      description: '',
      license: 'cc',
      ipfsHash: '',
      metadata: {},
      footprintId: '',
      footprintShare: 50,
      isMemeing: false,
      memeText: '',
      topMemeText: '',
      loading: false,
      isInTransaction: false,
      isBadAddress: false,
      txHash: '',
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
    checkAddress() {
      return this.wallet.length === 42 && this.wallet.substr(0, 2) === '0x';
    },
    onSubmit() {
      this.isBadAddress = false;
      if (!this.checkAddress()) {
        this.isBadAddress = true;
        return;
      }
      this.loading = true;
      api.apiPostMeme(this.uid, this.topMemeText, this.memeText, this.getSerializedMetaData())
      .then((result) => {
        this.$refs.snackbar.open();
        this.isInTransaction = true;
        this.txHash = result.data.txHash;
        EthHelper.waitForTxToBeMined(
          result.data.txHash,
          (err) => {
            this.loading = false;
            this.isInTransaction = false;
            this.$refs.snackbar.close();
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
    setTimeout(() => {
      const localWallet = EthHelper.getWallet();
      if (localWallet) {
        this.wallet = localWallet;
      }
    }, 2000);
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

form {
  margin: 20px;
}

.metadatas {
  margin: 20px;
}

</style>
