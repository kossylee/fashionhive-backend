import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Revenue endpoint
  let res1 = http.get(`${BASE_URL}/analytics/revenue?range=30`);
  check(res1, { 'revenue status 200': (r) => r.status === 200 });

  // Orders endpoint
  let res2 = http.get(`${BASE_URL}/analytics/orders?status=shipped`);
  check(res2, { 'orders status 200': (r) => r.status === 200 });

  // User growth endpoint
  let res3 = http.get(`${BASE_URL}/analytics/user-growth`);
  check(res3, { 'user-growth status 200': (r) => r.status === 200 });

  sleep(0.1);
}
