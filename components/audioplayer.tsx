import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";

export default function AudioPlayer({ uri }: { uri: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [loading, setLoading] = useState(true);

  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    loadAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [uri]);

  const loadAudio = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(sound);
    } catch (err) {
      console.log("Audio load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 1);
      setPlaying(status.isPlaying);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;

    const status = await sound.getStatusAsync();

    if (status.isLoaded) {
      if (status.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  };

  const handleSlidingComplete = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <View style={styles.player}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={togglePlayPause}
      >
        <Text style={styles.buttonText}>
          {playing ? "Pause" : "Play"}
        </Text>
      </TouchableOpacity>

      <Slider
        style={{ width: "100%", height: 40 }}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        onSlidingComplete={handleSlidingComplete}
      />

      <View style={styles.timeRow}>
        <Text>{formatTime(position)}</Text>
        <Text>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  player: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
  },

  playButton: {
    backgroundColor: "#6a5ae0",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});