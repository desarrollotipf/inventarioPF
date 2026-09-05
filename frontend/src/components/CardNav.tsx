import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ArrowUpRight, ChevronDown, LayoutGrid, X } from 'lucide-react';
import './CardNav.css';

export interface CardNavItem {
  to: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export interface CardNavProps {
  logo?: React.ReactNode;
  items: CardNavItem[];
  rightContent?: React.ReactNode;
  ease?: string;
  className?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

export const CardNav: React.FC<CardNavProps> = ({
  logo,
  items,
  rightContent,
  ease = 'power3.out',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isAnimatingRef = useRef(false);

  // Close when location changes
  useEffect(() => {
    if (isOpen) {
      closeMenu();
    }
  }, [location.pathname]);

  const openMenu = useCallback(() => {
    if (!navRef.current || !bodyRef.current) return;
    setIsOpen(true);
    isAnimatingRef.current = true;

    const cards = cardsRef.current.filter(Boolean);
    const bodyHeight = bodyRef.current.scrollHeight;
    const totalHeight = 64 + bodyHeight;

    gsap.killTweensOf(navRef.current);
    gsap.killTweensOf(cards);

    gsap.to(navRef.current, {
      height: totalHeight,
      duration: 0.38,
      ease,
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });

    gsap.fromTo(
      cards,
      { y: 22, opacity: 0, scale: 0.98 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.3,
        stagger: 0.04,
        ease,
      }
    );
  }, [ease]);

  const closeMenu = useCallback(() => {
    if (!navRef.current) return;
    const cards = cardsRef.current.filter(Boolean);

    isAnimatingRef.current = true;
    gsap.killTweensOf(navRef.current);
    gsap.killTweensOf(cards);

    gsap.to(cards, {
      y: 15,
      opacity: 0,
      scale: 0.98,
      duration: 0.2,
      stagger: 0.02,
      ease: 'power2.in',
    });

    gsap.to(navRef.current, {
      height: 64,
      duration: 0.3,
      ease,
      delay: 0.05,
      onComplete: () => {
        setIsOpen(false);
        isAnimatingRef.current = false;
      },
    });
  }, [ease]);

  const toggleMenu = () => {
    if (isAnimatingRef.current) return;
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!isOpen) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  return (
    <div ref={containerRef} className={`card-nav-wrapper${isOpen ? ' is-open' : ''} ${className}`}>
      <div className="card-nav-container">
        <nav ref={navRef} className={`card-nav${isOpen ? ' open' : ''}`}>
          {/* Top Bar Header */}
          <div className="card-nav-header">
            <div className="card-nav-logo-area" onClick={() => navigate('/')}>
              {logo}
            </div>

            <div className="card-nav-right-area">
              {rightContent}

              {/* CardNav Interactive Toggle Button */}
              <button
                type="button"
                onClick={toggleMenu}
                className={`card-nav-toggle-btn${isOpen ? ' is-active' : ''}`}
                aria-expanded={isOpen}
                aria-label="Abrir menú de navegación CardNav"
              >
                {isOpen ? (
                  <>
                    <X className="w-4 h-4" />
                    <span>Cerrar</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4 card-nav-toggle-icon" />
                    <span>Módulos</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expandable CardNav Body with Staggered GSAP Cards */}
          <div ref={bodyRef} className="card-nav-body">
            <div className="card-nav-grid">
              {items.map((item, idx) => {
                const Icon = item.icon;
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);

                return (
                  <div
                    key={item.to}
                    ref={(el) => {
                      cardsRef.current[idx] = el;
                    }}
                    onClick={() => {
                      navigate(item.to);
                      closeMenu();
                    }}
                    className={`card-nav-card${isActive ? ' is-active-route' : ''}`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="card-nav-card-top">
                      <div className="card-nav-card-icon-wrapper">
                        {Icon && <Icon className="w-5 h-5" />}
                      </div>
                      {item.badge && (
                        <span className="card-nav-card-badge">{item.badge}</span>
                      )}
                    </div>

                    <div className="card-nav-card-info">
                      <div className="card-nav-card-title">
                        <span>{item.label}</span>
                        <ArrowUpRight className="card-nav-card-arrow" />
                      </div>
                      {item.description && (
                        <p className="card-nav-card-desc">{item.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default CardNav;
