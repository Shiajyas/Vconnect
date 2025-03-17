import { Routes, Route } from "react-router-dom";
import PostList from "@/customeComponents/home/post/PostList";
import PostDetails from "@/customeComponents/home/post/PostDetails";
import Notification from "@/customeComponents/home/Notification";
import ProfilePage from "@/customeComponents/home/profile/ProfilePage";

const HomeRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PostList />} />
      <Route path="/post/:postId" element={<PostDetails />} />
      <Route path="/notifications" element={<Notification />} />
      <Route path="/profile/:userId" element={<ProfilePage />} />
    </Routes>
  );
};

export default HomeRoutes;
