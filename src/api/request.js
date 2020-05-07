const baseUrl = process.env.API_URL ? process.env.API_URL : "";
import http from "./http";
// import axios from "axios";

export default {
  appfindDoctorpage(param, callbak) {
    return http.get(`${baseUrl}/doctor/appfindDoctorpage.json`, param, callbak);
  },
  findUserAppAccount(param, callbak) {
    return http.get(`${baseUrl}/app/findUserAppAccount.json`, param, callbak);
  },
  updateNetPinLogin(param, callbak) {
    return http.get(`${baseUrl}/updateNetPinLogin.htm`, param, callbak);
  },
  findUserGroupDetail(param, callbak) {
    return http.get(`${baseUrl}/app/findUserGroupDetail.json`, param, callbak);
  }
};
