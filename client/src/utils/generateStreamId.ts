import { v4 as uuidv4 } from 'uuid';

export const generateStreamId = (userId: string): string => {
  return `${userId}-${uuidv4()}`;
};

export default generateStreamId;