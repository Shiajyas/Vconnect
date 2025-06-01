import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useMutation } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import FollowBtn from '@/customeComponents/FollowBtn';
import { useSubscription } from '@/hooks/stripeHooks/useSubscription';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import SubscriptionStatus from '@/customeComponents/common/SubscriptionModal';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/appStore/AuthStore';



interface ProfileHeaderProps {
  user:
    | {
        fullname: string;
        username: string;
        email?: string;
        bio?: string;
        avatar?: string;
        gender?: string;
        mobile?: string;
        address?: string;
        website?: string;
        following?: [];
        followers?: [];
      }
    | undefined;
  userId: string;
  refetch: () => void;
  parentUserId: string;
}

const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-lg w-full relative border border-gray-200"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close modal"
        >
          <span className="text-xl font-bold">×</span>
        </button>
        <div className="space-y-4">{children}</div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, userId, refetch, parentUserId }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [searchParams] = useSearchParams();

  const { updateUserFields,user: authUser} = useAuthStore();

  console.log('authUser>>>>>>>>>', authUser);
const queryClient = useQueryClient();

  const {
    data: subscription,
    isLoading: subscriptionLoading,
    refreshSubscription,
  } = useSubscription({ parentUserId });

  const confirmSubscription = async () => {
    try {
      await userService.confirmSubscription(userId);

      refreshSubscription(); // refresh only here
    } catch (err) {}
  };

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');

    // Only trigger after navigation type is 'navigate' or 'reload' (i.e., full page load)
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const isRedirect = navEntry?.type === 'navigate' || navEntry?.type === 'reload';

    if (isRedirect && clientSecret) {
      if (redirectStatus === 'succeeded') {
        confirmSubscription();
        toast.success('Payment successful! Subscription confirmed.');
      } else {
        toast.error('Payment failed! Please try again.');
      }
    }
  }, [searchParams]);

  const handleSubscritionModelClose = async () => {
    // refreshSubscription();
    setShowSubscriptionModal(false);
  };

  const handleSubscriptionModalOpen = () => {
    refreshSubscription();
    setShowSubscriptionModal(true);
  };

  const [profileData, setProfileData] = useState({
    fullname: user?.fullname || '',
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || '',
    gender: user?.gender || 'male',
    mobile: user?.mobile || '',
    address: user?.address || '',
    website: user?.website || '',
    avatar: user?.avatar || '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullname: user.fullname || '',
        username: user.username || '',
        bio: user.bio || '',
        email: user.email || '',
        gender: user.gender || 'male',
        mobile: user.mobile || '',
        address: user.address || '',
        website: user.website || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    if (!profileData.fullname.trim()) newErrors.fullname = 'Full name is required.';
    if (!profileData.username.trim()) newErrors.username = 'Username is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) newErrors.email = 'Invalid email.';
    if (profileData.mobile && !/^\+?\d{10,15}$/.test(profileData.mobile)) {
      newErrors.mobile = 'Invalid mobile number.';
    }
    if (
      profileData.website &&
      !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(profileData.website)
    ) {
      newErrors.website = 'Invalid website URL.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateProfile = useMutation({
  mutationFn: async () => {
    setLoading(true);
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => formData.append(key, value));
    if (avatarFile) formData.append('avatar', avatarFile);
    const updatedUser = await userService.updateUserProfile(userId, formData);
    return updatedUser; // Make sure your service returns updated user data
  },
  onSuccess: (data) => {
    setLoading(false);
    setEditing(false);

    // Update the React Query cache with the new user data
    queryClient.setQueryData(['user', data.id], data);

    console.log('Updated user data>>>>>>>>>:', data);

    // Update your auth store's user state
   updateUserFields({
    avatar: data.user.avatar,
    username: data.user.username,
    fullname: data.user.fullname,
  });
    // Navigate after update
    // navigate('/home');

    // Optionally, if you want to refetch or invalidate:
    // queryClient.invalidateQueries(['user']);
  },
  onError: () => setLoading(false),
});


  // const updateProfile = useMutation({
  //   mutationFn: async () => {
  //     setLoading(true);
  //     const formData = new FormData();
  //     Object.entries(profileData).forEach(([key, value]) => formData.append(key, value));
  //     if (avatarFile) formData.append('avatar', avatarFile);
  //     await userService.updateUserProfile(userId, formData);
  //   },
  //   onSuccess: () => {
  //     setLoading(false);
  //     refetch();
  //     setEditing(false);
  //   },
  //   onError: () => setLoading(false),
  // });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarFile(e.target.files[0]);
      setProfileData((prev) => ({ ...prev, avatar: URL.createObjectURL(e.target.files[0]) }));
    }
  };

  const isFollowing =
    (user?.followers ?? []).includes(parentUserId) ||
    (user?.following ?? []).includes(parentUserId);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="p-6 relative overflow-visible">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarImage src={profileData.avatar} alt={user?.fullname || 'User'} />
                <AvatarFallback>{user?.fullname?.slice(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
              </Avatar>
              {editing && (
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.fullname}</h2>
              <p className="text-sm text-gray-500">@{user?.username}</p>
            </div>
          </div>

          {userId === parentUserId && !isFollowing ? (
            <Button onClick={() => setEditing(!editing)} variant="outline">
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          ) : (
            <FollowBtn followingId={userId} isFollowing={isFollowing} userId={parentUserId} />
          )}
        </div>

        <Separator className="my-4" />

        <Button onClick={handleSubscriptionModalOpen} variant="outline" className="mb-4">
          View Subscription Details
        </Button>

        {showSubscriptionModal && (
          <Modal onClose={handleSubscritionModelClose}>
            <SubscriptionStatus
              subscription={subscription}
              isLoading={subscriptionLoading}
              userId={userId}
              refreshSubscription={refreshSubscription}
            />
          </Modal>
        )}

        {editing ? (
          <div className="space-y-4">
            {[
              { label: 'Full Name', key: 'fullname', required: true },
              { label: 'Username', key: 'username', required: true },
              { label: 'Bio', key: 'bio', textarea: true },
              { label: 'Email', key: 'email', disabled: true },
              { label: 'Mobile', key: 'mobile', required: true },
              { label: 'Address', key: 'address' },
              { label: 'Website', key: 'website' },
            ].map(({ label, key, textarea, disabled, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                {textarea ? (
                  <Textarea
                    value={profileData[key as keyof typeof profileData]}
                    onChange={(e) => setProfileData({ ...profileData, [key]: e.target.value })}
                    placeholder={`Enter your ${label.toLowerCase()}`}
                  />
                ) : (
                  <Input
                    value={profileData[key as keyof typeof profileData]}
                    onChange={(e) => setProfileData({ ...profileData, [key]: e.target.value })}
                    placeholder={`Enter your ${label.toLowerCase()}`}
                    disabled={disabled}
                  />
                )}
                {errors[key] && <p className="text-red-500 text-sm">{errors[key]}</p>}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <Select
                value={profileData.gender}
                onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue>{profileData.gender}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => validateForm() && updateProfile.mutate()}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition duration-200"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        ) : (
          <div>
            <p>{user?.bio || 'No bio available'}</p>
            {user?.website && (
              <p>
                🌐{' '}
                <a href={user.website} target="_blank" className="text-blue-500" rel="noreferrer">
                  {user.website}
                </a>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
