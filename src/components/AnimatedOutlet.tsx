import { useRef, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';

/**
 * Animated route transition wrapper.
 * Applies a fade+slide animation when the route changes.
 */
export default function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const [displayedOutlet, setDisplayedOutlet] = useState(outlet);
  const [animClass, setAnimClass] = useState('page-transition-enter');
  const prevPath = useRef(location.pathname);
  const currentOutlet = useRef(outlet);

  // Track latest outlet
  currentOutlet.current = outlet;

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      // Start exit animation
      setAnimClass('page-transition-exit');
      const timer = setTimeout(() => {
        setDisplayedOutlet(currentOutlet.current);
        setAnimClass('page-transition-enter');
        prevPath.current = location.pathname;
      }, 150); // match CSS duration
      return () => clearTimeout(timer);
    } else {
      // Same path - just update outlet immediately without animation
      setDisplayedOutlet(outlet);
    }
  }, [location.pathname, outlet]);

  return (
    <div className={animClass}>
      {displayedOutlet}
    </div>
  );
}
