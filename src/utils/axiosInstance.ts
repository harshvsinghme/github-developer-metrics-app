import axios from 'axios';

const localApi = axios.create(); // no baseURL, default Next.js local API

export default localApi;
