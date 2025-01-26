
export const getErrorMessage = (error: unknown): string => {
    return error instanceof Error ? error.message : "An unknown error occurred.";
};