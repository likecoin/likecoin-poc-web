const debug = process.env.NODE_ENV !== 'production';

const HOST = debug ? 'http://localhost:3001' : '';
export default HOST;
