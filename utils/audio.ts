import { Audio } from "expo-av";
import { Alert } from "react-native";

export const startRecording = async (): Promise<Audio.Recording | null> => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Error",
        "Microphone permission is required to record voice notes.",
      );
      return null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    await recording.startAsync();
    return recording;
  } catch (err) {
    console.error("Failed to start recording", err);
    return null;
  }
};

export const stopRecording = async (
  recording: Audio.Recording,
): Promise<string | null> => {
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    return uri;
  } catch (err) {
    console.error("Failed to stop recording", err);
    return null;
  }
};
