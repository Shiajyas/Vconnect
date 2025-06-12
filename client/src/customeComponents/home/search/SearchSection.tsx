import { useEffect, useCallback,useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { searchService } from '@/services/searchService';
import { debounce } from 'lodash';
import { IUser } from '@/types/userTypes';
import { IPost } from '@/types/postTypes';
import { ISearchResult } from '@/types/searchTypes';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '@/appStore/searchStore';

export const SearchSection = () => {
  const { query, setQuery } = useSearchStore();
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const navigate = useNavigate();

  // Debounce input
  const debouncedSetQuery = useCallback(
    debounce((val: string) => {
      setDebouncedQuery(val);
    }, 300),
    []
  );

  // Update debounce on query change
  useEffect(() => {
    debouncedSetQuery(query);
    return () => debouncedSetQuery.cancel();
  }, [query, debouncedSetQuery]);

  const { data, isLoading, isFetching, isError, error } = useQuery<ISearchResult>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchService.searchAll(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  const handleUserClick = useCallback(
    (userId: string) => {
      navigate(`/home/profile/${userId}`);
    },
    [navigate]
  );

  return (
    <div className="p-4 bg-white rounded shadow max-w-full">
      <Input
        placeholder="Search users or posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4"
      />

      {(isLoading || isFetching) && <p className="text-sm text-gray-500">Searching...</p>}
      {isError && (
        <p className="text-sm text-red-500">
          Error: {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      )}

      {!isLoading && !isFetching && !isError && data && (
        <>
          {data.users.length === 0 && data.posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-8">
              <img
                src="/image.png"
                alt="No results"
                className="w-48 h-48 object-contain mb-3"
              />
              <p className="text-gray-600 text-sm">No users or posts found.</p>
            </div>
          ) : (
            <>
              {data.users.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 text-lg">Users</h4>
                  <div className="space-y-2">
                    {data.users.map((user: IUser) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 cursor-pointer transition"
                        onClick={() => handleUserClick(user._id)}
                      >
                        <img
                          src={user.avatar}
                          className="h-9 w-9 rounded-full object-cover shadow"
                          alt={user.username}
                        />
                        <span className="text-sm text-gray-800 font-medium">@{user.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.posts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Posts</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {data.posts.map((post: IPost) => (
                      <div
                        key={post._id}
                        onClick={() => navigate(`/home/post/${post._id}`)}
                        className="relative group overflow-hidden rounded shadow hover:scale-105 transition cursor-pointer"
                      >
                        <img
                          src={post.mediaUrls?.[0] || '/placeholder.jpg'}
                          alt="Post media"
                          className="h-40 w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-sm p-2 text-center">
                          {post.description?.slice(0, 80) || 'No description'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
