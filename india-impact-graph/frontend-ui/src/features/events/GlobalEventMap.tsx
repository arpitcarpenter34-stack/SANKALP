import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type * as LType from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GlobalEventRecord, ImpactSeverity } from './types';
import styles from './GlobalEventMap.module.css';

export interface GlobalEventMapProps {
  events: GlobalEventRecord[];
  selectedEventId?: string;
  onSelectEvent: (eventId: string) => void;
  reportingPeriodLabel?: string;
}

export function getMarkerColor(sev: ImpactSeverity): string {
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
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function createPopupHtml(event: GlobalEventRecord): string {
  const severityLabel =
    event.severity === 'high'
      ? 'High Impact'
      : event.severity === 'medium'
      ? 'Medium Impact'
      : event.severity === 'low'
      ? 'Low Impact'
      : 'Monitoring';

  const severityClass =
    event.severity === 'high'
      ? styles.calloutSeverityHigh
      : event.severity === 'medium'
      ? styles.calloutSeverityMedium
      : event.severity === 'low'
      ? styles.calloutSeverityLow
      : styles.calloutSeverityMonitoring;

  return `
    <div class="${styles.calloutCard}">
      <div class="${styles.calloutLocation}">${escapeHtml(event.locationName)}</div>
      <div class="${styles.calloutTitle}">${escapeHtml(event.title)}</div>
      <div class="${styles.calloutMeta}">
        <span class="${styles.calloutSeverity} ${severityClass}">${severityLabel}</span>
        <span class="${styles.calloutDate}">${escapeHtml(event.eventDate)}</span>
      </div>
    </div>
  `;
}

export const GlobalEventMap: React.FC<GlobalEventMapProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  reportingPeriodLabel = 'Last 7 days',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);
  const markersLayerRef = useRef<LType.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, LType.Marker>>(new Map());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const leafletLibRef = useRef<typeof LType | null>(null);
  const [isTileOffline, setIsTileOffline] = useState<boolean>(false);

  // Strictly filter out any records with missing, invalid, or non-numeric coordinates
  const validEvents = useMemo(() => {
    return events.filter(
      (ev) =>
        ev.coordinates &&
        typeof ev.coordinates.lat === 'number' &&
        typeof ev.coordinates.lng === 'number' &&
        !isNaN(ev.coordinates.lat) &&
        !isNaN(ev.coordinates.lng) &&
        ev.coordinates.lat >= -90 &&
        ev.coordinates.lat <= 90 &&
        ev.coordinates.lng >= -180 &&
        ev.coordinates.lng <= 180
    );
  }, [events]);

  // Marker creation helper
  const renderMarkers = useCallback(
    (L: typeof LType, _map: LType.Map, markersGroup: LType.LayerGroup) => {
      markersGroup.clearLayers();
      markersMapRef.current.clear();

      validEvents.forEach((ev) => {
        const isSelected = ev.id === selectedEventId;
        const color = getMarkerColor(ev.severity);
        const pulseHtml =
          ev.severity === 'high'
            ? `<div class="${styles.markerPulse}" style="--marker-color: ${color}"></div>`
            : '';
        const selectedClass = isSelected ? styles.markerSelected : '';

        const markerIcon = L.divIcon({
          className: styles.markerContainer,
          html: `
            <div class="${styles.markerWrapper} ${selectedClass}">
              ${pulseHtml}
              <div class="${styles.markerDot}" style="background-color: ${color}"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([ev.coordinates.lat, ev.coordinates.lng], {
          icon: markerIcon,
          title: `${ev.title} (${ev.locationName})`,
          keyboard: true,
          zIndexOffset: isSelected ? 1000 : 100,
        });

        const popup = L.popup({
          className: styles.leafletCustomPopup,
          closeButton: false,
          autoClose: false,
          closeOnClick: false,
          offset: [0, -10],
        }).setContent(createPopupHtml(ev));

        marker.bindPopup(popup);

        marker.on('click', () => {
          onSelectEvent(ev.id);
        });

        markersGroup.addLayer(marker);
        markersMapRef.current.set(ev.id, marker);

        if (isSelected) {
          marker.openPopup();
        }
      });

      if (selectedEventId && markersMapRef.current.has(selectedEventId)) {
        const activeMarker = markersMapRef.current.get(selectedEventId);
        if (activeMarker) {
          activeMarker.openPopup();
        }
      }
    },
    [validEvents, selectedEventId, onSelectEvent]
  );

  // 1. Initialize Leaflet Map Instance with dynamic client-side loading
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;
    let isCancelled = false;

    import('leaflet').then((leafletModule) => {
      const L = (leafletModule.default || leafletModule) as typeof LType;
      if (isCancelled || !containerRef.current || mapInstanceRef.current) return;

      leafletLibRef.current = L;

      const map = L.map(containerRef.current, {
        center: [20, 15],
        zoom: 2,
        minZoom: 1.5,
        maxZoom: 9,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        worldCopyJump: true,
      });

      const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
      const isCartoConfigured = Boolean(cartoApiKey);

      const tileUrl = isCartoConfigured
        ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=${cartoApiKey}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const attributionText = isCartoConfigured
        ? '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

      L.control
        .attribution({
          position: 'bottomleft',
          prefix: false,
        })
        .addAttribution(attributionText)
        .addTo(map);

      const tileLayer = L.tileLayer(tileUrl, {
        subdomains: isCartoConfigured ? 'abcd' : 'abc',
        maxZoom: 19,
        minZoom: 1.5,
      });

      tileLayer.on('tileerror', () => setIsTileOffline(true));
      tileLayer.on('tileload', () => setIsTileOffline(false));
      tileLayer.addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      renderMarkers(L, map, markersGroup);

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(containerRef.current);
      resizeObserverRef.current = resizeObserver;
    });

    return () => {
      isCancelled = true;
      resizeObserverRef.current?.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersLayerRef.current = null;
      markersMapRef.current.clear();
      leafletLibRef.current = null;
    };
  }, [renderMarkers]);

  // 2. Synchronize markers when events or selectedEventId changes
  useEffect(() => {
    const L = leafletLibRef.current;
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!L || !map || !markersGroup) return;

    renderMarkers(L, map, markersGroup);
  }, [validEvents, selectedEventId, renderMarkers]);

  // 3. Pan to selected event when selectedEventId changes from parent list
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedEventId) return;

    const activeMarker = markersMapRef.current.get(selectedEventId);
    if (activeMarker) {
      activeMarker.openPopup();
      const latLng = activeMarker.getLatLng();
      map.panTo(latLng, { animate: true, duration: 0.4 });
    }
  }, [selectedEventId]);

  // Controls Handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetOrFit = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([20, 15], 2);
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
      <div className={styles.mapContainer}>
        {/* Real Leaflet Map DOM Node */}
        <div ref={containerRef} className={styles.leafletHost} />

        {/* Offline notification badge if tiles fail to load */}
        {isTileOffline && (
          <div className={styles.offlineNotice} role="status">
            Offline mode • Vector markers active
          </div>
        )}

        {/* Empty state overlay when no valid geographic events match */}
        {validEvents.length === 0 && (
          <div className={styles.noMarkersOverlay}>
            <span>No geographical events in this filter window</span>
          </div>
        )}

        {/* Floating Zoom & Fit Controls (Preserved exact icons and layout) */}
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
            onClick={handleResetOrFit}
            title="Fit / Reset map view"
            aria-label="Fit / Reset map view"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Legend Footer (High, Medium, Low, Monitoring) */}
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
