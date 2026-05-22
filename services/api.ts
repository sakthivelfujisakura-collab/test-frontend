import axios from 'axios';
import { TestResult } from "../types/test";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

console.log("API:", process.env.EXPO_PUBLIC_API_URL);

if (!API_BASE) {
  throw new Error('EXPO_PUBLIC_API_URL is not defined');
}

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// ✅ UPDATED: create session with level + set
export const createSession = (payload: {
  question_set_id: number;
  user_id: number;
}) => api.post("/sessions", payload);

// ✅ UPDATED: get config using level + set
export const getSetConfig = (level: string, setNumber: number) =>
  api.get(`/test/set-config?level=${level}&set_number=${setNumber}`);

export const getSession = (sessionId: number) =>
  api.get(`/sessions/${sessionId}`);

export const submitAnswer = (sessionId: number, answer: any) =>
  api.post(`/sessions/${sessionId}/answer`, answer);

export const submitSession = (sessionId: number) =>
  api.post(`/sessions/${sessionId}/submit`);

export const getTestResult = (sessionId: number) =>
  api.get<TestResult>(`/sessions/${sessionId}/result`);  


