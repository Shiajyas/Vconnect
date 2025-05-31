

import { fetchData } from "@/utils/axiosHelpers";


export const adminOverviewService = {
    getAdminOverview: () => fetchData('/admin/overview', { method: 'GET' }, 'Failed to fetch admin overview'),
};