<template>
  <div class="uploadimage">
    <md-card>
    <md-card-content>
    <div class="image-preview">
        <img class="preview" :src="imageData">
    </div>
    <form id="imageMetadata" v-on:submit.prevent="onSubmit">
      <md-input-container>
        <label>Image upload</label>
        <md-file v-model="image" @selected="previewImage" accept="image/*"></md-file>
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
      <h2>Image references
      <md-button class="md-icon-button" @click.native="addFootprint">
        <md-icon>playlist_add</md-icon>
      </md-button></h2>
      <div v-for="f in footprints">
        <md-input-container>
          <label>Refernce Image UID</label>
          <md-input v-model="f.id"></md-input>
        </md-input-container>
        <md-input-container>
          <label>Refernce Image share</label>
          <md-input v-model="f.value"></md-input>
        </md-input-container>
      </div>
      <md-button v-if="footprints && footprints.length > 0"
        class="md-icon-button" @click.native="removeFootprint">
        <md-icon>remove</md-icon>
      </md-button>
      <md-button type="submit" form="imageMetadata">OK</md-button>
    </form>
    </md-card-content>
    </md-card>
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
      this.footprints.push({ id: '', value: 0.1 });
    },
    removeFootprint() {
      this.footprints.pop();
    },
    onSubmit() {
      api.apiPostUploadImage(this.getSerializedMetaData())
      .then((result) => {
        EthHelper.onClick(result.data);
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
</style>
