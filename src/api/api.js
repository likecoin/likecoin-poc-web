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

export const apiGetMetadata = uid => axios.get(`${HOST}/query/${uid}`);
