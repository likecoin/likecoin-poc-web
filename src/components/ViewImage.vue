<template>
  <div class="view">
    <img :src="imgUrl" />
    <div v-if="isMemeing"></div>
    <md-button @click="isMemeing=!isMemeing"> MEME! </md-button>
    <form id="imageMetadata" v-if="isMemeing" v-on:submit.prevent="onSubmit">
      <md-input-container>
        <label>Meme</label>
        <md-input v-model="memeText"></md-input>
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
      <md-button type="submit" form="imageMetadata">OK</md-button>
    </form>
    <ul v-else>
      <li v-for="(value, key) in metadata">
        <span>{{ key }} : {{ value }}</span>
      </li>
    </ul>
    <a v-for="k in footprints" @click="onFootprintClick(k)"> {{ k }}</a>
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
    onFootprintClick(uid) {
      this.$router.push({ name: 'ViewImage', params: { uid } });
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
