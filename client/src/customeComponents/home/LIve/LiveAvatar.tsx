import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

type Props = {
  avatarUrl: string
  username: string
  isLive: boolean
  onClick?: () => void
  isStartButton?: boolean
}

const LiveAvatar = ({ avatarUrl, username, isLive , onClick, isStartButton }: Props) => {
    // const isLiveClass = isLive ? 'bg-gradient-to-tr from-blue-500 to-blue-600' : ''
  return (
    <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
      <div className="relative">
        {isLive && (
          <motion.div
            className="absolute inset-0 rounded-full z-0"
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
            transition={{
              duration: 1.3,
              repeat: Infinity,
              ease: "circInOut",
            }}
            style={{
              background: 'linear-gradient(to right, #00f, #00f)',
              filter: 'blur(4px)',
            }}
          />
        )}

        <div
          className={clsx(
            'relative z-10 rounded-full p-[2px]',
            isLive ? 'bg-gradient-to-tr from-blue-500 to-blue-600' : ''
          )}
        >
          <div className="bg-white rounded-full p-1">
            <img
              src={avatarUrl}
              alt={username}
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
        </div>
      </div>
      <span className="text-xs mt-1 text-center font-semibold">
        {isStartButton ? '+' : isLive ? 'LIVE' : username}
      </span>
    </div>
  )
}

export default LiveAvatar
