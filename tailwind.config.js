/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./services/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Add mobile-specific spacing
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Add mobile screen sizes
      screens: {
        'xs': '475px',
        'mobile': '375px',
        'mobile-lg': '414px',
        'mobile-xl': '480px',
        '3xl': '1600px',
      },
      // Add mobile-specific animations
      animation: {
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
        'pulse-green': 'pulseGreen 2s infinite',
        'pulse-red': 'pulseRed 2s infinite',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        pulseGreen: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        pulseRed: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      // Add mobile-specific colors
      colors: {
        mobile: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          'status-bar': '#000000',
        },
        // Instagram-inspired gradients
        instagram: {
          pink: '#E1306C',
          purple: '#833AB4',
          orange: '#F56040',
          yellow: '#FCCC63',
        },
        // Social media brand colors
        social: {
          instagram: '#E4405F',
          twitter: '#1DA1F2',
          linkedin: '#0077B5',
          tiktok: '#FF0050',
          youtube: '#FF0000',
          facebook: '#1877F2',
        },
        // Analytics colors
        analytics: {
          'growth-green': '#10B981',
          'engagement-blue': '#3B82F6',
          'reach-orange': '#F59E0B',
          'performance-purple': '#8B5CF6',
          'warning-yellow': '#FCD34D',
          'error-red': '#EF4444',
        },
      },
      // Add mobile-specific font sizes
      fontSize: {
        'mobile-xs': ['0.6875rem', { lineHeight: '1rem' }],
        'mobile-sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'mobile-tiny': ['0.625rem', { lineHeight: '0.875rem' }],
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      // Add mobile-specific border radius
      borderRadius: {
        'mobile': '1.25rem',
        'mobile-lg': '1.5rem',
        'mobile-xl': '2rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      // Add mobile-specific shadows
      boxShadow: {
        'mobile': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'mobile-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'mobile-xl': '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
        'inner-mobile': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.3)',
      },
      // Add gradient stops for better mobile gradients
      gradientColorStops: {
        'instagram-start': '#833AB4',
        'instagram-middle': '#E1306C',
        'instagram-end': '#F56040',
      },
      // Add mobile-specific backdrop blur
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      // Add mobile-specific z-index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      // Add custom aspect ratios
      aspectRatio: {
        'instagram': '1/1',
        'story': '9/16',
        'post': '4/5',
        'cover': '16/9',
      },
      // Add custom grid configurations
      gridTemplateColumns: {
        'mobile-2': 'repeat(2, minmax(0, 1fr))',
        'mobile-3': 'repeat(3, minmax(0, 1fr))',
        'auto-fit': 'repeat(auto-fit, minmax(200px, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(200px, 1fr))',
      },
      // Add custom transitions
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
      },
      // Add custom transform origins
      transformOrigin: {
        'top-left-1/4': '25% 25%',
        'top-1/4': '50% 25%',
        'top-right-1/4': '75% 25%',
        'right-1/4': '75% 50%',
        'bottom-right-1/4': '75% 75%',
        'bottom-1/4': '50% 75%',
        'bottom-left-1/4': '25% 75%',
        'left-1/4': '25% 50%',
      },
    },
  },
  plugins: [
    // Custom utilities plugin
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Mobile scroll utilities
        '.mobile-scroll': {
          '-webkit-overflow-scrolling': 'touch',
          'scroll-behavior': 'smooth',
        },
        '.mobile-scroll-snap': {
          'scroll-snap-type': 'x mandatory',
          '-webkit-overflow-scrolling': 'touch',
        },
        '.mobile-scroll-snap-item': {
          'scroll-snap-align': 'start',
        },
        
        // Mobile touch targets
        '.mobile-touch-target': {
          'min-height': '44px',
          'min-width': '44px',
        },
        '.mobile-touch-target-sm': {
          'min-height': '36px',
          'min-width': '36px',
        },
        '.mobile-touch-target-lg': {
          'min-height': '52px',
          'min-width': '52px',
        },
        
        // Safe area utilities
        '.mobile-safe-area': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.mobile-safe-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.mobile-safe-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.mobile-safe-left': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.mobile-safe-right': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        
        // Mobile container utilities
        '.mobile-container': {
          'max-width': '375px',
          'margin': '0 auto',
          'background': 'white',
          'box-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          'border-radius': '1.5rem',
          'overflow': 'hidden',
          'height': '100vh',
          'position': 'relative',
        },
        
        // Status bar simulation
        '.mobile-status-bar': {
          'background': '#000',
          'color': 'white',
          'font-size': '0.75rem',
          'padding': '0.25rem 1rem',
          'display': 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'font-weight': '500',
        },
        
        // Glass morphism effects
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.25)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.18)',
        },
        '.glass-dark': {
          'background': 'rgba(0, 0, 0, 0.25)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.18)',
        },
        
        // Gradient utilities
        '.gradient-instagram': {
          'background': 'linear-gradient(45deg, #833AB4, #E1306C, #F56040)',
        },
        '.gradient-mobile-blue': {
          'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        '.gradient-mobile-purple': {
          'background': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        },
        
        // Text utilities for mobile
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
        
        // Mobile-specific flexbox utilities
        '.flex-mobile-col': {
          'display': 'flex',
          'flex-direction': 'column',
          'height': '100vh',
        },
        '.flex-mobile-safe': {
          'display': 'flex',
          'flex-direction': 'column',
          'height': '100vh',
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
      }
      addUtilities(newUtilities)
    },
    
    // Additional plugin for component utilities
    function({ addComponents, theme }) {
      const components = {
        // Mobile button components
        '.btn-mobile': {
          'padding': '0.75rem 1.5rem',
          'border-radius': '1rem',
          'font-weight': '600',
          'font-size': '0.875rem',
          'min-height': '44px',
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'transition': 'all 0.2s ease-in-out',
        },
        '.btn-mobile-sm': {
          'padding': '0.5rem 1rem',
          'border-radius': '0.75rem',
          'font-weight': '600',
          'font-size': '0.75rem',
          'min-height': '36px',
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'transition': 'all 0.2s ease-in-out',
        },
        '.btn-mobile-lg': {
          'padding': '1rem 2rem',
          'border-radius': '1.25rem',
          'font-weight': '600',
          'font-size': '1rem',
          'min-height': '52px',
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'transition': 'all 0.2s ease-in-out',
        },
        
        // Mobile card components
        '.card-mobile': {
          'background': 'white',
          'border-radius': '1rem',
          'padding': '1rem',
          'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          'transition': 'all 0.2s ease-in-out',
        },
        '.card-mobile-hover': {
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        },
      }
      addComponents(components)
    },
  ],
};