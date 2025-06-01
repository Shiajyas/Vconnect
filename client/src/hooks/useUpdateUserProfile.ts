import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/appStore/AuthStore';
import { userService } from '@/services/userService';
import { toast } from 'react-toastify';
import { useState } from 'react';

export const useUpdateUserProfile = ({
  userId,
  profileData,
  avatarFile,
  setEditing,
}: {
  userId: string;
  profileData: Record<string, any>;
  avatarFile: File | null;
  setEditing: (value: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const updateProfile = useMutation({
    mutationFn: async () => {
      setLoading(true);

      const formData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // ✅ Ensure your API returns the updated user object
      const updatedUser = await userService.updateUserProfile(userId, formData);
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setLoading(false);
      setEditing(false);

      // ✅ Sync with Zustand and React Query
      queryClient.setQueryData(['user'], updatedUser);
      setUser(updatedUser);

      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      setLoading(false);
      console.error('❌ Error updating profile:', error);
      toast.error(error?.message || 'Failed to update profile');
    },
  });

  return {
    updateProfile,
    isUpdating: loading,
  };
};
