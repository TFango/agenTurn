import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

import { sendTextMessage, sendButtonMessage, sendListMessage } from './whatsapp';

beforeEach(() => {
  process.env.META_ACCESS_TOKEN = 'test_token';
  vi.clearAllMocks();
  (mockedAxios.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { messages: [{ id: 'wamid.test' }] } });
});

describe('sendTextMessage', () => {
  it('calls Meta API with correct payload', async () => {
    await sendTextMessage('phone_id_1', '5491112345678', 'Hola!');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://graph.facebook.com/v18.0/phone_id_1/messages',
      expect.objectContaining({ to: '5491112345678', type: 'text' }),
      expect.any(Object),
    );
  });
});

describe('sendButtonMessage', () => {
  it('sends interactive button message', async () => {
    await sendButtonMessage('phone_id_1', '5491112345678', '¿Qué querés?', [
      { id: 'book', title: 'Sacar turno' },
      { id: 'cancel', title: 'Cancelar turno' },
    ]);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ type: 'interactive' }),
      expect.any(Object),
    );
  });
});