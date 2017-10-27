const debug = process.env.NODE_ENV !== 'production';

const IPFS_HOST = debug ? 'http://localhost:8080/ipfs' : 'http://35.197.97.176:8080/ipfs';
export default IPFS_HOST;
