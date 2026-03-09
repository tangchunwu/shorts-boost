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

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      // Start exit
      setAnimClass('page-transition-exit');
      const timer = setTimeout(() => {
        setDisplayedOutlet(outlet);
        setAnimClass('page-transition-enter');
        prevPath.current = location.pathname;
      }, 150); // match CSS duration
      return () => clearTimeout(timer);
    }
  }, [location.pathname, outlet]);

  // Also update outlet content when it changes on same route
  useEffect(() => {
    if (location.pathname === prevPath.current) {
      setDisplayedOutlet(outlet);
    }
  }, [outlet, location.pathname]);

  return (
    <div className={animClass}>
      {displayedOutlet}
    </div>
  );
}
