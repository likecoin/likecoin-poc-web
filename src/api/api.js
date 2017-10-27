import axios from 'axios';

import HOST from './host';

export const apiPostUploadImage = (form) => {
  /* eslint-disable no-new */
  const params = new FormData();
  Object.keys(form).forEach((key) => {
    params.append(key, form[key]);
  });
  return axios.post(`${HOST}/upload`, params);
};

export const apiPostMeme = (uid, text, metadata) =>
  axios.post(`${HOST}/meme/${uid}`, { text, metadata });

export const apiGetMetadata = uid => axios.get(`${HOST}/query/${uid}`);

export const apiPostRinkeby = (id, data) =>
  axios.post(`https://rinkeby.infura.io/${id}`, data);
