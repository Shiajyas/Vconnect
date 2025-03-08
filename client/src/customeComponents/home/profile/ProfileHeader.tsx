import { useState,useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react"; // Loading spinner

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
  } | undefined;
  userId: string;
  refetch: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, userId, refetch }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({}); // Validation errors

  // Form validation
  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    if (!profileData.fullname.trim()) newErrors.fullname = "Full name is required.";
    if (!profileData.username.trim()) newErrors.username = "Username is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) newErrors.email = "Invalid email.";
    if (profileData.mobile && !/^\+?\d{10,15}$/.test(profileData.mobile)) {
      newErrors.mobile = "Invalid mobile number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with avatar upload
  const updateProfile = useMutation({
    mutationFn: async () => {
      setLoading(true);

      const formData = new FormData();
      formData.append("fullname", profileData.fullname);
      formData.append("username", profileData.username);
      formData.append("bio", profileData.bio);
      formData.append("email", profileData.email);
      formData.append("gender", profileData.gender);
      formData.append("mobile", profileData.mobile);
      formData.append("address", profileData.address);
      formData.append("website", profileData.website);

      if (avatarFile) {
        formData.append("avatar", avatarFile); // Append file if selected
      }

      await userService.updateUserProfile(userId, formData);
    },
    onSuccess: () => {
      setLoading(false);
      refetch();
      setEditing(false);
    },
    onError: () => setLoading(false),
  });

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarFile(e.target.files[0]); // Store file
      setProfileData((prev) => ({ ...prev, avatar: URL.createObjectURL(e?.target?.files[0]) })); // Show preview
    }
  };

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
          <Button onClick={() => setEditing(!editing)} variant="outline">
            {editing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Edit Profile Form */}
        {editing ? (
          <div className="space-y-4">
            <div>
              <Input
                value={profileData.fullname}
                onChange={(e) => setProfileData({ ...profileData, fullname: e.target.value })}
                placeholder="Full Name"
              />
              {errors.fullname && <p className="text-red-500 text-sm">{errors.fullname}</p>}
            </div>

            <div>
              <Input
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                placeholder="Username"
              />
              {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
            </div>

            <Textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              placeholder="Bio"
            />

            <div>
              <Input
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder= {profileData.email}
                type="email"
                disabled
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            <Select value={profileData.gender} onValueChange={(value) => setProfileData({ ...profileData, gender: value })}>
              <SelectTrigger>
                <SelectValue>{profileData.gender}</SelectValue>
              </SelectTrigger>
              <SelectContent className="z-[100]">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <div>
              <Input
                value={profileData.mobile}
                onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                placeholder="Mobile"
              />
              {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
            </div>

            <Input value={profileData.address} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} placeholder="Address" />
            <Input value={profileData.website} onChange={(e) => setProfileData({ ...profileData, website: e.target.value })} placeholder="Website" />

            <Button
              onClick={() => validateForm() && updateProfile.mutate()}
              className="w-full"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        ) : (
          <div className="text-gray-600 space-y-2">
            <p>{user?.bio || "No bio available"}</p>
            {user?.website && (
              <p>
                🌍 <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{user.website}</a>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
