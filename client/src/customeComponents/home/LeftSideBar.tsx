import React from 'react';
import { Home, MessageSquare, Bell, PlusCircle, User, Search, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/appStore/AuthStore';
import { socket } from '@/utils/Socket';
import useMessageStore from '@/appStore/useMessageStore';

interface LeftSideBarProps {
  selectedItem: string;
  setSelectedItem: (item: string) => void;
  unreadNotifications: number;
}

const LeftSideBar: React.FC<LeftSideBarProps> = ({
  selectedItem,
  setSelectedItem,
  unreadNotifications,
}) => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const unreadCounts = useMessageStore((state) => state.unreadCounts);
  const totalUnreadMessages = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

  // console.log("🔴 Total unread messages:", totalUnreadMessages);

  const menuItems = [
    { name: 'Home', icon: <Home />, path: '/home' },
    {
      name: 'Messages',
      icon: <MessageSquare />,
      path: '/home/messages',
      hasMessageBadge: true,
    },
    { name: 'Search', icon: <Search />, path: '/home/search' },
    {
      name: 'Notifications',
      icon: <Bell />,
      path: '/home/notifications',
      hasNotificationBadge: true,
    },
    { name: 'Create', icon: <PlusCircle />, path: `/home/create/${user?._id}` },
    { name: 'Profile', icon: <User />, path: `/home/profile/${user?._id}` },
  ];

  const handleMenuClick = (item: any) => {
    setSelectedItem(item.name);
    navigate(item.path);
  };

  const handleLogout = () => {
    if (user?._id) {
      socket.emit('logOut', user._id);
    }
    logout('user');
    navigate('/');
  };

  return (
    <Card className="h-full w-full bg-background shadow-lg p-4 rounded-2xl flex flex-col">
      <CardContent className="flex flex-col items-center space-y-6 flex-grow">
        {/* Logo */}
        <div className="w-full flex justify-center">
          <Avatar>
            <AvatarImage src="/logo.png" alt="Logo" className="w-25 h-30" />
            <AvatarFallback>Logo</AvatarFallback>
          </Avatar>
        </div>

        {/* Menu Items */}
        <div className="w-full space-y-3 mt-4 flex-grow">
          {menuItems.map((item, index) => {
            const showMessageBadge = item.hasMessageBadge && totalUnreadMessages > 0;
            const showNotificationBadge = item.hasNotificationBadge && unreadNotifications > 0;

            // Debugging to confirm conditions
            // console.log("showMessageBadge:", showMessageBadge);
            // console.log("showNotificationBadge:", showNotificationBadge);

            return (
              <Button
                key={index}
                variant="ghost"
                className={`relative flex items-center w-full justify-start px-4 py-3 text-lg font-medium rounded-lg ${
                  selectedItem === item.name
                    ? 'bg-accent text-primary font-bold'
                    : 'hover:bg-accent'
                }`}
                onClick={() => handleMenuClick(item)}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
                {(showMessageBadge || showNotificationBadge) && (
                  <Badge className=" top-1 right-1 bg-red-600 text-white text-[11px] px-2 py-[2px] rounded-full shadow-sm font-semibold leading-none flex items-center justify-center min-w-[20px] h-[18px]">
                    {showMessageBadge
                      ? totalUnreadMessages > 99
                        ? '99+'
                        : totalUnreadMessages
                      : unreadNotifications}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>

      {/* Logout Button */}
      <div className="p-4">
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-2 py-3"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </Card>
  );
};

export default LeftSideBar;
