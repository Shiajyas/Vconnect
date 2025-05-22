import { fetchData } from '../utils/axiosHelpers';

export const messageService = {
  getMessages: (chatId: any, page: number = 1, limit: number = 20) =>
    fetchData(
      `/user/messages/${chatId}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
      },
      'Failed to fetch messages',
    ),
};
