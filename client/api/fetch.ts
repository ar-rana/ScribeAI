import { TranscriptRecord } from "@/app/dashboard/page";
import axios from "axios";

const base_url = "http://localhost:3333/";

interface LoginPayload {
    email: string;
    name: string;
}

interface TranscriptPayload {
    email: string;
    client_id: string;
}

const url = {
  userLogin: "user/login",
  getRecordings: "list/",
  getSummary: "summary",
  saveTranscript: "user/recording",
};


export async function userLoggedin(payload: LoginPayload) {
  const headers = {
    "Content-Type": "application/json",
  };
  const path = base_url + url.userLogin;
  return axios
    .post(path, payload, { headers })
    .then((res) => {
      return {
        success: true,
        data: res.data,
      };
    })
    .catch((err) => {
      const errMsg = err.response ? err.response.data : err.message;
      console.log(errMsg);
      return {
        success: false,
        data: errMsg,
      };
    });
}

export async function getAllPastRecordings(email: string) {
  const headers = {
    "Content-Type": "application/json",
  };
  const path = base_url + url.getRecordings + email;
  return axios
    .get(path, { headers })
    .then((res) => {
      return {
        success: true,
        data: res.data,
      };
    })
    .catch((err) => {
      const errMsg = err.response ? err.response.data : err.message;
      console.log(errMsg);
      return {
        success: false,
        data: errMsg,
      };
    });
}

export async function getRecordingSummary(payload: TranscriptPayload) {
  const headers = {
    "Content-Type": "application/json",
  };
  const path = base_url + url.getSummary;
  return axios
    .post(path, payload, { headers })
    .then((res) => {
      return {
        success: true,
        data: res.data,
      };
    })
    .catch((err) => {
      const errMsg = err.response ? err.response.data : err.message;
      console.log(errMsg);
      return {
        success: false,
        data: errMsg,
      };
    });
}

export async function saveRecording(payload: TranscriptRecord) {
  const headers = {
    "Content-Type": "application/json",
  };
  const path = base_url + url.saveTranscript;
  return axios
    .post(path, payload, { headers })
    .then((res) => {
      return {
        success: true,
        data: res.data,
      };
    })
    .catch((err) => {
      const errMsg = err.response ? err.response.data : err.message;
      console.log(errMsg);
      return {
        success: false,
        data: errMsg,
      };
    });
}
