import { useEffect, useRef } from 'react';

const MAPBOX_TOKEN = ''; // Set your Mapbox token here

const MapboxDrawDemo = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const drawRef = useRef<any>(null);
  const drawFeatureID = useRef<string>('');
  const newDrawFeature = useRef<boolean>(false);

  useEffect(() => {
    // Dynamically import mapbox-gl and mapbox-gl-draw
    let mapboxgl: any, MapboxDraw: any;
    let map: any, draw: any;
    let cleanup = false;
    (async () => {
      mapboxgl = (await import('mapbox-gl')).default;
      MapboxDraw = (await import('@mapbox/mapbox-gl-draw')).default;
      // @ts-ignore
      mapboxgl.accessToken = MAPBOX_TOKEN;
      if (!mapContainerRef.current) return;
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v9',
        zoom: 7,
        center: [-76.462, 38.258],
      });
      draw = new MapboxDraw({
        userProperties: true,
        controls: {
          combine_features: false,
          uncombine_features: false,
        },
        styles: [
          // ... (copy all styles from the HTML file here)
          // default themes provided by MB Draw
          {
            id: 'gl-draw-polygon-fill-inactive',
            type: 'fill',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: {
              'fill-color': '#3bb2d0',
              'fill-outline-color': '#3bb2d0',
              'fill-opacity': 0.1
            }
          },
          {
            id: 'gl-draw-polygon-fill-active',
            type: 'fill',
            filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            paint: {
              'fill-color': '#fbb03b',
              'fill-outline-color': '#fbb03b',
              'fill-opacity': 0.1
            }
          },
          {
            id: 'gl-draw-polygon-midpoint',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
            paint: {
              'circle-radius': 3,
              'circle-color': '#fbb03b'
            }
          },
          {
            id: 'gl-draw-polygon-stroke-inactive',
            type: 'line',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#3bb2d0',
              'line-width': 2
            }
          },
          {
            id: 'gl-draw-polygon-stroke-active',
            type: 'line',
            filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#fbb03b',
              'line-dasharray': [0.2, 2],
              'line-width': 2
            }
          },
          {
            id: 'gl-draw-line-inactive',
            type: 'line',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#3bb2d0',
              'line-width': 2
            }
          },
          {
            id: 'gl-draw-line-active',
            type: 'line',
            filter: ['all', ['==', '$type', 'LineString'], ['==', 'active', 'true']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#fbb03b',
              'line-dasharray': [0.2, 2],
              'line-width': 2
            }
          },
          {
            id: 'gl-draw-polygon-and-line-vertex-stroke-inactive',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
            paint: {
              'circle-radius': 5,
              'circle-color': '#fff'
            }
          },
          {
            id: 'gl-draw-polygon-and-line-vertex-inactive',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
            paint: {
              'circle-radius': 3,
              'circle-color': '#fbb03b'
            }
          },
          {
            id: 'gl-draw-point-point-stroke-inactive',
            type: 'circle',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'mode', 'static']],
            paint: {
              'circle-radius': 5,
              'circle-opacity': 1,
              'circle-color': '#fff'
            }
          },
          {
            id: 'gl-draw-point-inactive',
            type: 'circle',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'mode', 'static']],
            paint: {
              'circle-radius': 3,
              'circle-color': '#3bb2d0'
            }
          },
          {
            id: 'gl-draw-point-stroke-active',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'active', 'true'], ['!=', 'meta', 'midpoint']],
            paint: {
              'circle-radius': 7,
              'circle-color': '#fff'
            }
          },
          {
            id: 'gl-draw-point-active',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['==', 'active', 'true']],
            paint: {
              'circle-radius': 5,
              'circle-color': '#fbb03b'
            }
          },
          {
            id: 'gl-draw-polygon-fill-static',
            type: 'fill',
            filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
            paint: {
              'fill-color': '#404040',
              'fill-outline-color': '#404040',
              'fill-opacity': 0.1
            }
          },
          {
            id: 'gl-draw-polygon-stroke-static',
            type: 'line',
            filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#404040',
              'line-width': 2
            }
          },
          {
            id: 'gl-draw-line-static',
            type: 'line',
            filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#404040',
              'line-width': 2
            }
          },
          {
            id: 'gl-draw-point-static',
            type: 'circle',
            filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Point']],
            paint: {
              'circle-radius': 5,
              'circle-color': '#404040'
            }
          },
          // end default themes provided by MB Draw
          // new styles for toggling colors
          {
            id: 'gl-draw-polygon-color-picker',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon'], ['has', 'user_portColor']],
            paint: {
              'fill-color': ['get', 'user_portColor'],
              'fill-outline-color': ['get', 'user_portColor'],
              'fill-opacity': 0.5
            }
          },
          {
            id: 'gl-draw-line-color-picker',
            type: 'line',
            filter: ['all', ['==', '$type', 'LineString'], ['has', 'user_portColor']],
            paint: {
              'line-color': ['get', 'user_portColor'],
              'line-width': 2
            }
          },
          {
            id: 'gl-draw-point-color-picker',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['has', 'user_portColor']],
            paint: {
              'circle-radius': 3,
              'circle-color': ['get', 'user_portColor']
            }
          },
        ]
      });
      map.addControl(draw, 'top-left');
      drawRef.current = draw;
      mapRef.current = map;
      // No color buttons for now
      // Clean up on unmount
      if (cleanup) return;
    })();
    return () => {
      cleanup = true;
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }}>
      <div ref={mapContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    </div>
  );
};

export default MapboxDrawDemo;