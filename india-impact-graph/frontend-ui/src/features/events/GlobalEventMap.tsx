import React, { useState, useRef } from 'react';
import { GlobalEventRecord, ImpactSeverity } from './types';
import styles from './GlobalEventMap.module.css';

export interface GlobalEventMapProps {
  events: GlobalEventRecord[];
  selectedEventId?: string;
  onSelectEvent: (eventId: string) => void;
  reportingPeriodLabel?: string;
}

// Projection helper: equirectangular projection onto 1000x500 viewBox
function projectCoordinates(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

// Realistic simplified SVG continent paths for clean analytical styling
const WORLD_CONTINENTS = [
  // North America
  'M 130 90 L 175 75 L 230 65 L 260 85 L 245 110 L 220 125 L 240 160 L 220 185 L 180 180 L 165 210 L 150 215 L 130 180 L 115 150 L 110 120 Z',
  // Greenland
  'M 290 40 L 340 35 L 360 60 L 330 85 L 300 75 Z',
  // South America
  'M 240 235 L 275 240 L 320 280 L 310 340 L 280 395 L 255 420 L 240 390 L 230 330 L 215 280 L 230 250 Z',
  // Europe
  'M 460 100 L 520 85 L 560 95 L 570 125 L 540 145 L 500 155 L 470 160 L 450 140 L 450 115 Z',
  // Scandinavia
  'M 500 60 L 530 50 L 545 75 L 525 95 L 505 80 Z',
  // Africa
  'M 470 180 L 535 180 L 570 220 L 585 270 L 550 350 L 520 380 L 485 360 L 460 280 L 440 220 Z',
  // Asia
  'M 570 90 L 650 70 L 740 75 L 820 100 L 870 135 L 830 175 L 800 200 L 750 250 L 720 280 L 690 260 L 660 210 L 630 190 L 580 160 Z',
  // India Subcontinent
  'M 660 215 L 700 225 L 710 260 L 685 300 L 665 270 Z',
  // Southeast Asia & Indonesia
  'M 755 260 L 785 275 L 810 270 L 830 295 L 815 315 L 775 305 Z',
  // Australia
  'M 790 350 L 850 340 L 880 375 L 870 425 L 825 435 L 795 400 Z',
  // Japan
  'M 845 155 L 860 175 L 850 200 L 835 180 Z',
];



export const GlobalEventMap: React.FC<GlobalEventMapProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  reportingPeriodLabel = 'last 30 days',
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.35, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.35, 0.9));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Strictly filter out any records with missing, invalid, or non-numeric coordinates
  const validEvents = events.filter(
    (ev) =>
      ev.coordinates &&
      typeof ev.coordinates.lat === 'number' &&
      typeof ev.coordinates.lng === 'number' &&
      !isNaN(ev.coordinates.lat) &&
      !isNaN(ev.coordinates.lng)
  );

  const activeEvent = validEvents.find((ev) => ev.id === selectedEventId) || validEvents[0];
  const activePoint =
    activeEvent && activeEvent.coordinates
      ? projectCoordinates(activeEvent.coordinates.lat, activeEvent.coordinates.lng)
      : null;

  const getMarkerColor = (sev: ImpactSeverity) => {
    switch (sev) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F97316';
      case 'low':
        return '#EAB308';
      case 'monitoring':
      default:
        return '#10B981';
    }
  };

  return (
    <div className={styles.mapCard} aria-label="Global Event Map Visualizer">
      {/* Header */}
      <div className={styles.mapHeader}>
        <div>
          <h2 className={styles.mapTitle}>Global Event Map</h2>
          <p className={styles.mapSubtitle}>
            Recent significant events ({reportingPeriodLabel})
          </p>
        </div>
      </div>

      {/* Map Interactive Container */}
      <div
        className={styles.mapContainer}
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className={styles.mapSvg}
          viewBox="0 0 1000 500"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <defs>
            <radialGradient id="waterGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#FAFCFA" />
              <stop offset="100%" stopColor="#F1F8F4" />
            </radialGradient>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ocean Background */}
          <rect x="0" y="0" width="1000" height="500" fill="url(#waterGrad)" />

          {/* Subtle Grid Lat/Long Lines */}
          <line x1="0" y1="125" x2="1000" y2="125" className={styles.graticule} />
          <line x1="0" y1="250" x2="1000" y2="250" className={styles.graticule} />
          <line x1="0" y1="375" x2="1000" y2="375" className={styles.graticule} />
          <line x1="250" y1="0" x2="250" y2="500" className={styles.graticule} />
          <line x1="500" y1="0" x2="500" y2="500" className={styles.graticule} />
          <line x1="750" y1="0" x2="750" y2="500" className={styles.graticule} />

          {/* Continents */}
          <g id="continents">
            {WORLD_CONTINENTS.map((d, idx) => (
              <path key={idx} d={d} className={styles.landmass} />
            ))}
          </g>

          {/* Primary Event Markers (Verified Coordinates Only) */}
          <g id="event-markers">
            {validEvents.map((ev) => {
              const pt = projectCoordinates(ev.coordinates.lat, ev.coordinates.lng);
              const isSelected = ev.id === selectedEventId;
              const color = getMarkerColor(ev.severity);

              return (
                <g
                  key={ev.id}
                  className={`${styles.markerGroup} ${isSelected ? styles.markerSelected : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(ev.id);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${ev.title} (${ev.severity} impact) at ${ev.locationName}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectEvent(ev.id);
                    }
                  }}
                >
                  {/* Pulse ring for high severity */}
                  {ev.severity === 'high' && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="12"
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      className={styles.markerPulse}
                    />
                  )}

                  {/* Marker Outer Ring */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 9 : 7}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 3 : 2}
                    className={styles.markerOuter}
                  />

                  {/* Pin Dot Center */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="2.5"
                    fill="#ffffff"
                    className={styles.markerPin}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {/* Empty state overlay when no valid geographic events match */}
        {validEvents.length === 0 && (
          <div className={styles.noMarkersOverlay}>
            <span>No geographical events in this filter window</span>
          </div>
        )}

        {/* Selected Event Callout Popover Card (matching Taiwan callout in reference) */}
        {activeEvent && activePoint && (
          <div
            className={styles.calloutCard}
            style={{
              left: `${(activePoint.x / 1000) * 100}%`,
              top: `${(activePoint.y / 500) * 100}%`,
              transform:
                activePoint.x > 700
                  ? 'translate(-85%, -115%)'
                  : activePoint.x < 200
                  ? 'translate(-15%, -115%)'
                  : 'translate(-50%, -115%)',
            }}
          >
            <div className={styles.calloutLocation}>{activeEvent.locationName}</div>
            <div className={styles.calloutTitle}>{activeEvent.title}</div>
            <div className={styles.calloutMeta}>
              <span
                className={`${styles.calloutSeverity} ${
                  activeEvent.severity === 'high'
                    ? styles.calloutSeverityHigh
                    : activeEvent.severity === 'medium'
                    ? styles.calloutSeverityMedium
                    : activeEvent.severity === 'low'
                    ? styles.calloutSeverityLow
                    : styles.calloutSeverityMonitoring
                }`}
              >
                {activeEvent.severity === 'high'
                  ? 'High Impact'
                  : activeEvent.severity === 'medium'
                  ? 'Medium Impact'
                  : activeEvent.severity === 'low'
                  ? 'Low Impact'
                  : 'Monitoring'}
              </span>
              <span className={styles.calloutDate}>{activeEvent.eventDate}</span>
            </div>
          </div>
        )}

        {/* Floating Zoom & Reset Controls */}
        <div className={styles.mapControls} aria-label="Map view controls">
          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={handleZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={handleZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={handleReset}
            title="Fit / Reset map view"
            aria-label="Reset map"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Legend Footer */}
      <div className={styles.mapLegend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotHigh}`} />
          <span>High Impact</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotMedium}`} />
          <span>Medium Impact</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotLow}`} />
          <span>Low Impact</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotMonitoring}`} />
          <span>Monitoring</span>
        </div>
      </div>
    </div>
  );
};
