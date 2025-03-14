import axios from 'axios';

const http = axios.create({
    baseURL:  `http://localhost/API/`, 
    timeout: 10000, 
});