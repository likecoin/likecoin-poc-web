<template>
  <div class="uploadimage">
    <md-progress v-if="loading" :class="isInTransaction?'md-accent':''" md-indeterminate></md-progress>
    <md-layout md-gutter>
    <md-layout md-align="center" md-column
      md-flex-xsmall="100" md-flex-small="100"
      md-flex-medium="80" md-flex-offset-medium="10"
      md-flex-large="40"
      md-flex-xlarge="50">
    <div class="image-preview">
      <md-image :md-src="imageData" />
    </div>
    </md-layout>
    <md-layout md-column md-gutter
      md-flex-xsmall="100" md-flex-small="100" md-flex-medium="100"
      md-flex="50">
    <form id="imageMetadata" v-on:submit.prevent="onSubmit">
      <md-input-container>
        <label>Image upload</label>
        <md-file v-model="image" @selected="previewImage" accept="image/*"></md-file>
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
      <md-button class="md-icon-button" @click.native="addFootprint">
        <md-icon>playlist_add</md-icon>
      </md-button></h2>
      <div v-for="f in footprints">
        <md-input-container>
          <label>Parent content Fingerprint</label>
          <md-input v-model="f.id"></md-input>
        </md-input-container>
        <md-input-container>
          <label>Parent contribution %</label>
          <md-input v-model="f.share"></md-input>
        </md-input-container>
      </div>
      <md-button v-if="footprints && footprints.length > 0"
        class="md-icon-button" @click.native="removeFootprint">
        <md-icon>remove</md-icon>
      </md-button>
      <md-button class="md-raised" type="submit" form="imageMetadata">OK</md-button>
    </form>
    </md-layout>
    </md-layout>
    <md-snackbar md-duration="30000" ref="snackbar">
      <span>Transaction pending. It usually takes less than a minute to process.</span>
      <a v-if="txHash" :href="'https://rinkeby.etherscan.io/tx/'+txHash" target="_blank"> View on etherscan </a>
    </md-snackbar>
  </div>
</template>

<script>
import defaultImage from '@/assets/logo.png';

import EthHelper from '@/util/EthHelper';
import * as api from '@/api/api';

export default {
  name: 'UploadImage',
  data() {
    return {
      imageData: defaultImage,
      image: null,
      imageFile: null,
      author: '',
      description: '',
      license: '',
      footprints: [],
      wallet: EthHelper.getWallet(),
      loading: false,
      isInTransaction: false,
      txHash: '',
    };
  },
  methods: {
    getSerializedMetaData() {
      const { imageFile, author, wallet, description, license, footprints } = this;
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
    addFootprint() {
      this.footprints.push({ id: '', share: 0.1 });
    },
    removeFootprint() {
      this.footprints.pop();
    },
    onSubmit() {
      this.loading = true;
      api.apiPostUploadImage(this.getSerializedMetaData())
      .then((result) => {
        this.$refs.snackbar.open();
        this.isInTransaction = true;
        this.txHash = result.data.txHash;
        EthHelper.waitForTxToBeMined(
          result.data.txHash,
          (err) => {
            this.loading = false;
            this.isInTransaction = false;
            if (err) return;
            this.$router.push({ name: 'ViewImage', params: { uid: result.data.id } });
          },
        );
      });
    },
  },
  mounted() {
    if (!this.wallet) {
      setTimeout(() => {
        if (!this.wallet && EthHelper.getWallet()) {
          this.wallet = EthHelper.getWallet();
        }
      }, 3000);
    }
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

</style>
