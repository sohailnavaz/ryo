import { View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  /** Optional count badge (e.g. number of homes in a city cluster). */
  count?: number;
};

export type MapProps = {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
  /**
   * Optional markers. ADDITIVE — when omitted the map renders a single
   * terracotta pin at lat/lng (original behaviour). When provided, these
   * markers are rendered instead and the region is widened to a region delta.
   */
  markers?: MapMarker[];
  /** Fired with the marker id when a marker is pressed. */
  onMarkerPress?: (id: string) => void;
  /** Optional id to highlight (rendered in terracotta). */
  selectedId?: string;
  /** Optional container style override (e.g. custom height). */
  style?: StyleProp<ViewStyle>;
};

export function Map({ lat, lng, className, markers, onMarkerPress, selectedId, style }: MapProps) {
  const list = markers && markers.length > 0 ? markers : null;

  // Widen the region when showing multiple markers so the cluster is visible.
  const delta = list && list.length > 1 ? 18 : 0.02;

  return (
    <View
      className={className}
      style={[{ width: '100%', height: 240, borderRadius: 16, overflow: 'hidden' }, style]}
    >
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: delta,
          longitudeDelta: delta,
        }}
      >
        {list ? (
          list.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.lat, longitude: m.lng }}
              title={m.label}
              description={typeof m.count === 'number' ? `${m.count} homes` : undefined}
              pinColor={m.id === selectedId ? '#C87156' : '#1F5A6B'}
              onPress={() => onMarkerPress?.(m.id)}
            />
          ))
        ) : (
          <Marker coordinate={{ latitude: lat, longitude: lng }} pinColor="#C87156" />
        )}
      </MapView>
    </View>
  );
}
