<template>
  <div class="view">
    <md-progress v-if="loading" :class="isInTransaction?'md-accent':''" md-indeterminate></md-progress>
    <md-layout md-gutter>
    <md-layout md-align="center" md-column
      md-flex-medium="100"
      md-flex-large="40"
      md-flex="50">
      <div v-if="uid" class="image-view">
        <md-spinner v-if="!ipfsHash" md-indeterminate />
        <md-ipfs-image  v-else :ipfsSrc="imgUrl" />
      </div>
      <div v-else class="image-preview">
        <md-image :md-src="imageData" />
      </div>
    </md-layout>
    <md-layout md-column
      md-flex-medium="100"
      md-flex-large="60"
      md-flex="50">
    <form v-if="isShowForm" id="imageMetadata" v-on:submit.prevent="onSubmit">
      <md-input-container v-if="!isMemeing">
        <label>Image upload</label>
        <md-file v-model="image" @selected="previewImage" accept="image/*" required></md-file>
      </md-input-container>
      <div v-else><md-input-container md-flex="50" class="md-input-invalid">
        <label>Top Meme Text</label>
        <md-textarea placeholder=">PUT MEME HERE" v-model="topMemeText"></md-textarea>
      </md-input-container>
      <md-input-container md-flex="50" class="md-input-invalid">
        <label>Bottom Meme Text</label>
        <md-textarea placeholder=">PUT MEME HERE" v-model="memeText"></md-textarea>
      </md-input-container></div>
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
      <div v-if="isMemeing">
        <h2>Image parents</h2>
<!--    <md-button class="md-icon-button" @click.native="addFootprint">
          <md-icon>playlist_add</md-icon>
        </md-button></h2>
        <div v-for="f in footprints">
          <md-input-container>
            <label>Parent content Fingerprint</label>
            <md-input v-model="f.id" required></md-input>
          </md-input-container>
          <md-input-container>
            <label>Parent contribution %</label>
            <md-input v-model="f.share" type="number" min="0" max="100" required></md-input>
          </md-input-container>
        </div>
        <md-button v-if="footprints && footprints.length > 0"
          class="md-icon-button" @click.native="removeFootprint">
          <md-icon>remove</md-icon>
        </md-button> -->
        <md-input-container>
          <label>Parent content Fingerprint</label>
          <md-input disabled v-model="footprintId" required></md-input>
        </md-input-container>
        <md-input-container>
          <label>Parent contribution %</label>
          <md-input v-model="footprintShare" type="number" min="0" max="100" required></md-input>
        </md-input-container>
      </div>
      <md-button v-if="isMemeing" @click="isMemeing=false">Cancel</md-button>
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
      <md-table v-if="metafootprints && metafootprints.length > 0">
        <md-table-header>
          <md-table-row>
            <md-table-head>Parent content Fingerprint</md-table-head>
            <md-table-head>Parent contribution %</md-table-head>
          </md-table-row>
        </md-table-header>
        <md-table-body>
          <md-table-row  v-for="(k, i) in metafootprints" :key="k">
            <md-table-cell><router-link :to="{ name: 'ViewImage', params: { uid: k }}"> {{ k }}</router-link></md-table-cell>
            <md-table-cell>{{ parseInt(footprintShares[i], 16) }}</md-table-cell>
          </md-table-row>
        </md-table-body>
      </md-table>
    </div>
    <span><md-button class="md-primary md-raised" v-if="uid && !isMemeing" @click="isMemeing=true"> MEME! </md-button></span>
    </md-layout>
    </md-layout>
    <md-snackbar md-duration="60000" ref="snackbar">
      <span>Transaction pending. It usually takes less than a minute to process.</span>
      <a v-if="txHash" :href="'https://rinkeby.etherscan.io/tx/'+txHash" target="_blank"> View on etherscan </a>
    </md-snackbar>
    <md-dialog-alert
      :md-content="errorMsg"
      ref="dialog">
    </md-dialog-alert>
  </div>
</template>

<script>
import moment from 'moment';

import defaultImage from '@/assets/logo.png';
import EthHelper from '@/util/EthHelper';
import * as api from '@/api/api';
import MdIpfsImage from './MdIpfsImage';

export default {
  name: 'ViewImage',
  data() {
    return {
      uid: '',
      imageData: defaultImage,
      image: null,
      imageFile: null,
      author: '',
      description: '',
      license: 'cc',
      ipfsHash: '',
      metadata: {},
      footprintId: '',
      footprintShare: 50,
      isMemeing: false,
      memeText: '',
      topMemeText: '',
      footprints: [],
      wallet: EthHelper.getWallet() || '0x81f9b6c7129cee90fed5df241fa6dc4f88a19699',
      loading: false,
      isInTransaction: false,
      isBadAddress: false,
      txHash: '',
      errorMsg: 'No error',
    };
  },
  components: {
    'md-ipfs-image': MdIpfsImage,
  },
  computed: {
    imgUrl() {
      return `${this.ipfsHash}`;
    },
    metafootprints() {
      return this.metadata.footprintIds;
    },
    footprintShares() {
      return this.metadata.footprintShares;
    },
    isShowForm() {
      return (!this.uid || this.isMemeing);
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
        })
        .catch((err) => {
          this.errorMsg = err.response.data;
          this.$refs.dialog.open();
        });
      }
    },
    parseTimeStamp(hex) {
      const t = new Date(parseInt(hex, 16) * 1000);
      return moment(t).format('YYYY-MM-DD HH:mm:ss');
    },
    getSerializedMetaData() {
      const { imageFile, author, wallet, description, license, footprintId, footprintShare } = this;
      const footprints = this.isMemeing ?
        [{ id: footprintId, share: footprintShare }] : this.footprints;
      return { image: imageFile,
        author,
        wallet,
        description,
        license,
        footprints: JSON.stringify(footprints),
      };
    },
    previewImage(files) {
      if (files && files[0]) {
        this.imageFile = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imageData = e.target.result;
        };
        reader.readAsDataURL(files[0]);
      }
    },
    checkAddress() {
      return this.wallet.length === 42 && this.wallet.substr(0, 2) === '0x';
    },
    addFootprint() {
      this.footprints.push({ id: '', share: 10 });
    },
    removeFootprint() {
      this.footprints.pop();
    },
    onSubmit() {
      this.isBadAddress = false;
      if (!this.checkAddress()) {
        this.isBadAddress = true;
        return;
      }
      this.loading = true;
      let targetApi = null;
      if (this.isMemeing) {
        targetApi = api.apiPostMeme(this.uid, this.topMemeText,
          this.memeText, this.getSerializedMetaData());
      } else {
        targetApi = api.apiPostUploadImage(this.getSerializedMetaData());
      }
      targetApi
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
            if (this.isMemeing) location.reload(); // refresh for better UX and less state problem
          },
        );
      })
      .catch((err) => {
        this.errorMsg = err.response.data;
        this.$refs.dialog.open();
      });
    },
  },
  mounted() {
    this.uid = this.$route.params.uid || '';
    if (this.uid) {
      this.refreshImage(this.uid);
    }
    setTimeout(() => {
      const localWallet = EthHelper.getWallet();
      if (localWallet) {
        this.wallet = localWallet;
      }
    }, 2000);
  },
  beforeRouteUpdate(to, from, next) {
    this.uid = to.params.uid || '';
    if (this.uid) {
      this.refreshImage(this.uid);
    }
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

@media (min-width:1264px) {
  form, .metadatas {
    margin: 20px;
  }
}

</style>
