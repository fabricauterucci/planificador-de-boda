import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import styles from "./map.module.css";

const MapInner = dynamic(() => import("./MapInner"), { ssr: false });

export default function Map({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className={styles.mapContainer}>
      <MapInner lat={lat} lng={lng} />
    </div>
  );
}
