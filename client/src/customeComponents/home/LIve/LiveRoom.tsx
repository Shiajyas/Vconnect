import { useParams } from 'react-router-dom';
import useLiveStream from '@/hooks/live/useLiveStream';
import LiveVideoPlayer from './LiveVideoPlayer';
import LiveComments from './LiveComments';
import { useLiveStore } from '@/appStore/useLiveStore';

const LiveRoom = () => {
  const { id: streamId } = useParams();
  const isHost = useLiveStore((s) => s.isHost);
  const isActive = useLiveStore((s) => s.isActive);

  console.log('LiveRoom', streamId, isHost, isActive);

  const { stream, comments, viewers, sendComment } = useLiveStream(isHost, streamId!, isActive);

  console.log('LiveRoom comments', comments);
  console.log('LiveRoom viewers', viewers);
  console.log('LiveRoom videoRef', stream);

  return (
    <div className="p-4">
      <LiveVideoPlayer stream={stream} isHost={isHost} />
      <p className="text-sm text-gray-600 mt-2">Viewers: {viewers}</p>
      <LiveComments comments={comments} onSend={sendComment} />
    </div>
  );
};

export default LiveRoom;
