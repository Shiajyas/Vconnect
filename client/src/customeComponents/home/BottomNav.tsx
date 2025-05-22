import { Home, Search, MessageSquare, Bell, User, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '@/store/notificationStore';
import { useAuthStore } from '@/appStore/AuthStore';

interface BottomNavProps {
  selectedItem: string;
  setSelectedItem: (item: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ selectedItem, setSelectedItem }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();

  const menuItems = [
    { name: 'Home', icon: <Home className="w-6 h-6" />, path: '/home' },
    { name: 'Search', icon: <Search className="w-6 h-6" />, path: '/home/search' },
    { name: 'Create', icon: <PlusCircle className="w-6 h-6" />, path: `/home/create/${user?._id}` },
    {
      name: 'Notifications',
      icon: <Bell className="w-6 h-6" />,
      path: '/home/notifications',
      hasBadge: true,
    },
    { name: 'Profile', icon: <User className="w-6 h-6" />, path: `/home/profile/${user?._id}` },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-md lg:hidden flex justify-between px-4 py-3">
      {menuItems.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          size="icon"
          className={`relative flex flex-col items-center text-gray-600 ${
            selectedItem === item.name ? 'text-primary font-bold' : 'hover:text-primary'
          }`}
          onClick={() => {
            setSelectedItem(item.name);
            navigate(item.path);
          }}
        >
          {item.icon}
          {item.hasBadge && unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
};

export default BottomNav;
