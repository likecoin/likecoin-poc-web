<template>
  <form id="imageMetadata" v-on:submit.prevent="onSubmit">
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
        <md-input disabled v-model="memeParentId" required></md-input>
      </md-input-container>
      <md-input-container>
        <label>Parent contribution %</label>
        <md-input v-model="footprintShare" type="number" min="0" max="100" required></md-input>
      </md-input-container>
    </div>
    <md-button v-if="isMemeing" @click="onCancel">Cancel</md-button>
    <md-button class="md-raised" type="submit" form="imageMetadata">OK</md-button>
  </form>
</template>
<script>
import EthHelper from '@/util/EthHelper';

export default {
  name: 'LikeFrom',
  props: {
    isMemeing: Boolean,
    memeParentId: String,
    submit: Function,
  },
  data() {
    return {
      topMemeText: '',
      memeText: '',
      imageFile: null,
      image: null,
      author: '',
      wallet: EthHelper.getWallet() || '0x81f9b6c7129cee90fed5df241fa6dc4f88a19699',
      description: '',
      license: 'cc',
      footprintShare: 50,
      footprints: [],
      isBadAddress: false,
    };
  },
  methods: {
    getSerializedMetaData() {
      const { imageFile, author, wallet, description,
        license, memeParentId, footprintShare } = this;
      const footprints = this.isMemeing ?
        [{ id: memeParentId, share: footprintShare }] : this.footprints;
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
          this.$emit('onPreview', e.target.result);
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
      const output = {
        topMemeText: this.topMemeText,
        memeText: this.memeText,
        metadata: this.getSerializedMetaData(),
      };
      this.$emit('submit', output);
    },
    onCancel() {
      this.$emit('Cancel');
    },
  },
};

</script>
