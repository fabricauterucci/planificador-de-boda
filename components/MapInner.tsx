import { useEffect } from 'react';
import L from 'leaflet';
import styles from "./map.module.css";

export default function MapInner({ lat, lng }: { lat: number; lng: number }) {
  useEffect(() => {
    const container = document.getElementById('map');
    if (!container) return;

    container.innerHTML = '';
    const map = L.map(container).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([lat, lng])
      .addTo(map)
      .bindPopup('Salón "Luz de Luna"<br/>¡Te esperamos!');

    return () => {
      map.remove();
    };
  }, [lat, lng]);

  return <div id="map" className={styles.mapContainer} />;
}
