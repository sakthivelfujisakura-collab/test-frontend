import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function EditQuestionScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const [question, setQuestion] = useState(
    params.question?.toString() || ""
  );

  const [option1, setOption1] = useState(
    params.option1?.toString() || ""
  );

  const [option2, setOption2] = useState(
    params.option2?.toString() || ""
  );

  const [option3, setOption3] = useState(
    params.option3?.toString() || ""
  );

  const [option4, setOption4] = useState(
    params.option4?.toString() || ""
  );

  const [correctOption, setCorrectOption] = useState(
    params.correct_option?.toString() || "1"
  );

  const handleSave = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/questions/${params.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question,
            options: [
              option1,
              option2,
              option3,
              option4,
            ],
            correct_option: Number(correctOption),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update question");
      }

      Alert.alert("Success", "Question updated successfully");

      router.back();
    } catch (err) {
      console.log(err);

      Alert.alert("Error", "Failed to update question");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Question</Text>

      <TextInput
        style={styles.input}
        value={question}
        onChangeText={setQuestion}
        placeholder="Question"
        multiline
      />

      <TextInput
        style={styles.input}
        value={option1}
        onChangeText={setOption1}
        placeholder="Option 1"
      />

      <TextInput
        style={styles.input}
        value={option2}
        onChangeText={setOption2}
        placeholder="Option 2"
      />

      <TextInput
        style={styles.input}
        value={option3}
        onChangeText={setOption3}
        placeholder="Option 3"
      />

      <TextInput
        style={styles.input}
        value={option4}
        onChangeText={setOption4}
        placeholder="Option 4"
      />

      <TextInput
        style={styles.input}
        value={correctOption}
        onChangeText={setCorrectOption}
        placeholder="Correct Option Number"
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>
          Save Changes
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f6fa",
    flexGrow: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#6a5ae0",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});