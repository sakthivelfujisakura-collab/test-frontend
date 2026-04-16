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

export const createSession = (payload: any) =>
  api.post('/sessions', payload);

export const getSession = (sessionId: number) =>
  api.get(`/sessions/${sessionId}`);

export const submitAnswer = (sessionId: number, answer: any) =>
  api.post(`/sessions/${sessionId}/answer`, answer);

export const submitSession = (sessionId: number) =>
  api.post(`/sessions/${sessionId}/submit`);

export const getTestResult = (sessionId: number) =>
  api.get<TestResult>(`/sessions/${sessionId}/result`);  

export const getSetConfig = (setId: number) =>
  api.get(`/sets/${setId}/config`);

