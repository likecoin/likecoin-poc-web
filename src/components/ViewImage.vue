<template>
  <div class="view">
    <md-layout md-gutter>
    <md-layout md-align="center"
      md-flex-xsmall="100" md-flex-small="100" md-flex-medium="100"
      md-flex-large="40" md-flex-offset-large="5"
      md-flex-xlarge="40" md-flex-offset-xlarge="5">
    <div class="image-view">
      <img :src="imgUrl" />
    </div>
    <div v-if="isMemeing"></div>
    </md-layout>
    <md-layout md-column md-gutter
      md-flex-xsmall="100" md-flex-small="100" md-flex-medium="100"
      md-flex="50">
    <md-card v-if="isMemeing">
    <md-card-content>
    <form id="imageMetadata" v-on:submit.prevent="onSubmit">
      <md-input-container>
        <label>Meme</label>
        <md-textarea v-model="memeText"></md-textarea>
      </md-input-container>
      <md-input-container>
        <label>Image Author</label>
        <md-input v-model="author"></md-input>
      </md-input-container>
      <md-input-container>
        <label>Image's ETH Wallet address</label>
        <md-input v-model="wallet"></md-input>
      </md-input-container>
      <md-input-container>
        <label>Image Description</label>
        <md-textarea v-model="description"></md-textarea>
      </md-input-container>
      <md-input-container>
        <label>Image License</label>
        <md-input v-model="license"></md-input>
      </md-input-container>
      <hr />
      <h2>Image references</h2>
      <div>
        <md-input-container>
          <label>Refernce Image UID</label>
          <md-input disabled v-model="footprintId"></md-input>
        </md-input-container>
        <md-input-container>
          <label>Refernce Image share</label>
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
        <md-table-body>
          <md-table-row  v-for="(value, key) in metadata" :key="key">
            <md-table-cell>{{ key }}</md-table-cell>
            <md-table-cell>{{ value }}</md-table-cell>
          </md-table-row>
        </md-table-body>
      </md-table>
      <md-table v-if="footprints">
        <md-table-body>
          <md-table-row  v-for="(k, i) in footprints" :key="k">
            <md-table-cell><router-link :to="{ name: 'ViewImage', params: { uid: k }}"> {{ k }}</router-link></md-table-cell>
            <md-table-cell>{{ footprintShares[i] }}</md-table-cell>
          </md-table-row>
        </md-table-body>
      </md-table>
    </md-table-card>
    <span><md-button class="md-primary md-raised" v-if="!isMemeing" @click="isMemeing=true"> MEME! </md-button></span>
    </md-layout>
    </md-layout>
  </div>
</template>

<script>
import * as api from '@/api/api';
import EthHelper from '@/util/EthHelper';

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
      memeText: 'Hi!',
    };
  },
  computed: {
    imgUrl() {
      return `https://ipfs.io/ipfs/${this.ipfsHash}`;
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
      api.apiPostMeme(this.uid, this.memeText, this.getSerializedMetaData())
      .then((result) => {
        EthHelper.onClick(result.data, (err) => {
          if (err) return;
          this.$router.push({ name: 'ViewImage', params: { uid: result.data.id } });
        });
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
