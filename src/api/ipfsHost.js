const debug = process.env.NODE_ENV !== 'production';

const IPFS_HOST = debug ? 'http://localhost:3001/ipfs' : '/ipfs';
export default IPFS_HOST;
