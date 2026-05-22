import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function EditPassageScreen() {
  const router = useRouter();

  const { group_id, passage_text } = useLocalSearchParams();

  const [passage, setPassage] = useState(
    String(passage_text || "")
  );

  const handleSave = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/question-groups/${group_id}/passage`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            passage_text: passage,
          }),
        }
      );

      const data = await res.json();

      Alert.alert("Success", data.message, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to update passage");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Passage</Text>

      <TextInput
        style={styles.input}
        multiline
        value={passage}
        onChangeText={setPassage}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>
          Save Changes
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    minHeight: 150,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#6a5ae0",
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});