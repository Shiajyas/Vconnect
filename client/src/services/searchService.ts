import { fetchData } from '@/utils/axiosHelpers';   

export const searchService = {
    searchAll: (query: string) => {
        return fetchData(
            `/users/search?query=${query}`,
            {
                method: 'GET',
            },
            'Failed to search',
        );
    },
};