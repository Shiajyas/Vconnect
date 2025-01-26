module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-fast': 'bounce 0.8s infinite',
        'spin-fast': 'spin 1s linear infinite', // Faster spinning animation
        'spin-grow': 'spin 1s linear infinite, grow 1s ease-in-out infinite', // Spinning with growth
     
      },
      colors: {
        pink: '#fb839e',
        violet: '#783F8E',
        blue: '#49275B',
        c1: '#FD2F24',
        c2: '#FF6F01',
        c3: '#FED800',
      },
      backgroundImage: {
        'background-1': 'linear-gradient(to right, #ffc3a0, #FFAFBD)',
        'background-2': 'linear-gradient(to right, #a770ef, #cf8bf3, #fdb99b)',
        'background-3': 'linear-gradient(to right, #fffc00, #ffffff)',
        'background-4': 'linear-gradient(to right, #833ab4, #fd1d1d, #fcb045)',
      },
      boxShadow: {
        'outer-shadow': '3px 3px 3px #d0d0d0, -3px -3px 3px #f8f8f8',
        'outer-shadow-0': '0 0 0 #d0d0d0, 0 0 0 #f8f8f8',
        'inner-shadow': 'inset 3px 3px 3px #d0d0d0, inset -3px -3px 3px #f8f8f8',
        'inner-shadow-0': 'inset 0 0 0 #d0d0d0, inset 0 0 0 #f8f8f8',
      },
    },
    keyframes: {
      grow: {
        '0%': {
          transform: 'scale(1)',
        },
        '50%': {
          transform: 'scale(1.2)',
        },
        '100%': {
          transform: 'scale(1)',
        },
      }
    },
    
  },
  plugins: [],
};
