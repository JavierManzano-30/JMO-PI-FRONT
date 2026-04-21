import { apiRequest } from '../lib/apiClient.js';

export async function sendTestEmail({ to, subject, text }) {
  return apiRequest('/email/test', {
    method: 'POST',
    auth: true,
    body: {
      to,
      subject,
      text,
    },
  });
}
