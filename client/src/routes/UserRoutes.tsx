
import { Route } from "react-router-dom";
import HomeLayout from "@/pages/User/Home";
import PostList from "@/customeComponents/home/post/PostList";
import PostDetails from "@/customeComponents/home/post/PostDetails";
import Notification from "@/customeComponents/home/Notification";
import ProfilePage from "@/customeComponents/home/profile/ProfilePage";
import PostUpload from "@/customeComponents/home/post/postUploadComponent";
import EditPost from "@/customeComponents/home/post/EditPost";
import ChatSection from "@/customeComponents/home/chat/ChatSection";
import UserPrivateRoute from "./UserPrivateRoute";

const UserRoutes = () => (
  <Route
    path="/home/*"
    element={
      <UserPrivateRoute>
        <HomeLayout />
      </UserPrivateRoute>
    }
  >
    <Route index element={<PostList />} />
    <Route path="post/:postId" element={<PostDetails />} />
    <Route path="notifications" element={<Notification />} />
    <Route path="profile/:userId" element={<ProfilePage />} />
    <Route path="create/:userId" element={<PostUpload />} />
    <Route path="edit-post/:postId" element={<EditPost />} />
    <Route path="messages" element={<ChatSection />} />
  </Route>
);

export default UserRoutes;
