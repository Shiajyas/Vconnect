import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import FollowBtn from "@/customeComponents/FollowBtn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react"; 

interface ProfileHeaderProps {
  user: {
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
  } | undefined;
  userId: string;
  refetch: () => void;
  parentUserId: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, userId, refetch, parentUserId }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [profileData, setProfileData] = useState({
    fullname: user?.fullname || "",
    username: user?.username || "",
    bio: user?.bio || "",
    email: user?.email || "",
    gender: user?.gender || "male",
    mobile: user?.mobile || "",
    address: user?.address || "",
    website: user?.website || "",
    avatar: user?.avatar || "",
  });

  // Update state when user data changes
  useEffect(() => {
    if (user) {
      setProfileData({
        fullname: user.fullname || "",
        username: user.username || "",
        bio: user.bio || "",
        email: user.email || "",
        gender: user.gender || "male",
        mobile: user.mobile || "",
        address: user.address || "",
        website: user.website || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  // Validate form
  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    if (!profileData.fullname.trim()) newErrors.fullname = "Full name is required.";
    if (!profileData.username.trim()) newErrors.username = "Username is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) newErrors.email = "Invalid email.";
    if (profileData.mobile && !/^\+?\d{10,15}$/.test(profileData.mobile)) {
      newErrors.mobile = "Invalid mobile number.";
    }
    if (profileData.website && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(profileData.website)) {
      newErrors.website = "Invalid website URL.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile update
  const updateProfile = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const formData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => formData.append(key, value));

      if (avatarFile) formData.append("avatar", avatarFile);

      await userService.updateUserProfile(userId, formData);
    },
    onSuccess: () => {
      setLoading(false);
      refetch(); // Refetch to get updated data
      setEditing(false);
    },
    onError: () => setLoading(false),
  });

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarFile(e.target.files[0]);
      setProfileData((prev) => ({ ...prev, avatar: URL.createObjectURL(e.target.files[0]) }));
    }
  };

  // Check if the logged-in user is following the profile user
  const isFollowing =
    (user?.followers ?? []).includes(parentUserId) || (user?.following ?? []).includes(parentUserId);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="p-6 relative overflow-visible">
        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Profile Picture Upload */}
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarImage src={profileData.avatar} alt={user?.fullname || "User"} />
                <AvatarFallback>{user?.fullname?.slice(0, 2).toUpperCase() || "NA"}</AvatarFallback>
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
              {editing ? "Cancel" : "Edit Profile"}
            </Button>
          ) : (
            <FollowBtn followingId={userId} isFollowing={isFollowing} userId={parentUserId} />
          )}
        </div>

        <Separator className="my-4" />

        {/* Edit Profile Form */}
        {editing ? (
          <div className="space-y-4">
            <Input
              value={profileData.fullname}
              onChange={(e) => setProfileData({ ...profileData, fullname: e.target.value })}
              placeholder="Full Name"
            />
            {errors.fullname && <p className="text-red-500 text-sm">{errors.fullname}</p>}

            <Input
              value={profileData.username}
              onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
              placeholder="Username"
            />
            {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}

            <Textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              placeholder="Bio"
            />

            <Input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              placeholder="Email"
              disabled
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

            <Input
              type="tel"
              value={profileData.mobile}
              onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
              placeholder="Mobile"
            />
            {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}

            <Input
              value={profileData.address}
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              placeholder="Address"
            />

            <Input
              value={profileData.website}
              onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
              placeholder="Website"
            />
            {errors.website && <p className="text-red-500 text-sm">{errors.website}</p>}

            <Select
              value={profileData.gender}
              onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
            >
              <SelectTrigger>
                <SelectValue>{profileData.gender}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-slate-400">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => validateForm() && updateProfile.mutate()}
              className="w-full"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        ) : (
          <div>
            <p>{user?.bio || "No bio available"}</p>
            {user?.website && (
              <p>
                🌐 <a href={user.website} target="_blank" className="text-blue-500">{user.website}</a>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export default ProfileHeader;
