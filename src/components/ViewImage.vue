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
    <like-form v-if="isShowForm" :isMemeing="isMemeing" :memeParentId="memeParentId" @submit="onSubmit" @onPreview="onPreview"
      @Cancel="isMemeing=!isMemeing"/>
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
            <md-table-cell v-else-if="key==='wallet'">
              <a :href="'https://rinkeby.etherscan.io/address/'+value" target="_blank">{{ value }}</a>
              <span v-if="likeCoinBalance"> | Likecoin: <a :href="'https://rinkeby.etherscan.io/address/'+value+'#tokentxns'" target="_blank"> {{ likeCoinBalance }} </a></span>
            </md-table-cell>
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
import BN from 'bn.js';

import defaultImage from '@/assets/logo.png';
import EthHelper from '@/util/EthHelper';
import * as api from '@/api/api';
import MdIpfsImage from './MdIpfsImage';
import LikeForm from './LikeForm';

const ONE_LIKE = new BN(10).pow(new BN(18));

export default {
  name: 'ViewImage',
  data() {
    return {
      uid: '',
      imageData: defaultImage,
      ipfsHash: '',
      metadata: {},
      memeParentId: '',
      isMemeing: false,
      loading: false,
      isInTransaction: false,
      txHash: '',
      errorMsg: 'No error',
      likeCoinBalance: undefined,
    };
  },
  components: {
    'md-ipfs-image': MdIpfsImage,
    'like-form': LikeForm,
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
          this.memeParentId = uid;
          return EthHelper.queryLikeCoinBalance(this.metadata.wallet);
        })
        .then((balance) => {
          this.likeCoinBalance = balance.balance.div(ONE_LIKE).toString(10);
        })
        .catch((err) => {
          this.errorMsg = err.message || err.response.data;
          this.$refs.dialog.open();
        });
      }
    },
    parseTimeStamp(hex) {
      const t = new Date(parseInt(hex, 16) * 1000);
      return moment(t).format('YYYY-MM-DD HH:mm:ss');
    },
    onSubmit(data) {
      this.loading = true;
      let targetApi = null;
      if (this.isMemeing) {
        targetApi = api.apiPostMeme(this.uid, data.topMemeText,
          data.memeText, data.metadata);
      } else {
        targetApi = api.apiPostUploadImage(data.metadata);
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
            setTimeout(() => {
              this.$router.push({ name: 'ViewImage', params: { uid: result.data.id } });
              if (this.isMemeing) location.reload(); // refresh for better UX
            }, 1000); // wait 1 second try to avoid strange stream issue
          },
        );
      })
      .catch((err) => {
        this.errorMsg = err.response.data;
        this.$refs.dialog.open();
      });
    },
    onPreview(data) {
      this.imageData = data;
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
