import { View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

export type MapProps = {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
};

export function Map({ lat, lng, className }: MapProps) {
  return (
    <View className={className} style={{ width: '100%', height: 240, borderRadius: 16, overflow: 'hidden' }}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={{ latitude: lat, longitude: lng }} pinColor="#ff385c" />
      </MapView>
    </View>
  );
}
