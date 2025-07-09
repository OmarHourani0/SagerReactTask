import mapboxgl from "mapbox-gl";

export const addMapControls = (map: mapboxgl.Map) => {
  map.addControl(new mapboxgl.NavigationControl(), "top-right");
  map.addControl(new mapboxgl.FullscreenControl(), "top-right");
  map.addControl(new mapboxgl.GeolocateControl(), "top-right");
}; 