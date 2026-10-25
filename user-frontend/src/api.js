
import axios from "axios";

const api = axios.create({
  baseURL: "http://10.128.144.132:8000",
});

export default api;
