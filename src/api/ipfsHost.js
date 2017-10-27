const debug = process.env.NODE_ENV !== 'production';

const IPFS_HOST = debug ? 'http://localhost:8080/ipfs' : '/ipfs';
export default IPFS_HOST;
