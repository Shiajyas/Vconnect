import { fetchData } from '../utils/axiosHelpers';

export const callService = {
  getCallHistory: async (userId: string) => {
    return fetchData(
      `/users/call_history/${userId}`,
      {
        method: 'GET',
      },
      'Failed to fetch call history',
    );
  },
};
