import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AudioPlayer from "../../components/audioplayer";
import { Picker } from "@react-native-picker/picker";
import { Image } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function QuestionsScreen() {
  const router = useRouter();
  const { testId , level } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState("manage");

type Question = {
  id: number;
  group_id: number;
  section_id: number;
  question: string;
  options: string[];
  correct_option: number;
  section: string;
  mondai_title: string;
  instruction: string;
  passage_text: string;
  audio_url?: string;
  image_url?: string;
};

const [questions, setQuestions] = useState<Question[]>([]); 

const [manualForm, setManualForm] = useState({
  section: "",
  duration: "",
  mondai_title: "",
  instruction: "",
  passage_text: "",
  question: "",
  option1: "",
  option2: "",
  option3: "",
  option4: "",
  correct_option: "",
  image_url: "",
  audio_url: "",
});

useFocusEffect(
  useCallback(() => {
    fetchQuestions();
  }, [])
);

  const fetchQuestions = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/questions?set_id=${testId}&level=${level}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      console.log("LEVEL:", level);
      console.log("TEST ID FROM PARAM:", testId);
      console.log("API RESPONSE:", data);
      if (Array.isArray(data)) {
        setQuestions(data);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");

      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/questions/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchQuestions();
    } catch (err) {
      console.log("Delete error:", err);
    }
  };

  const handleEdit = (q: any) => {
    router.push({
      pathname: "/admin/edit-question",
      params: {
        id: q.id,
        question: q.question,
        option1: q.options?.[0],
        option2: q.options?.[1],
        option3: q.options?.[2],
        option4: q.options?.[3],
        correct_option: q.correct_option,
      },
    });
  };

  const handleManualSave = async () => {
  console.log(manualForm);

  // backend API next
  };

  const groupQuestions = (questions: Question[]) => {
    const grouped: any = {};

    questions.forEach((q) => {
      if (!grouped[q.section]) {
        grouped[q.section] = {};
      }

    if (!grouped[q.section][q.mondai_title]) {
      grouped[q.section][q.mondai_title] = {
        instruction: q.instruction,
        passage_text: q.passage_text,
        audio_url: q.audio_url,
        section_id: q.section_id,
        group_id: q.group_id,
        questions: [],
      };
    }

        grouped[q.section][q.mondai_title].questions.push(q);
      });

      return grouped;
  };

  const sectionOrder = ["Vocabulary & Kanji", "Grammar & Reading", "Listening"];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={["#6a5ae0", "#5f7cf0"]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Test Management System</Text>
      </LinearGradient>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab("manual")}>
          <Text style={activeTab === "manual" ? styles.activeTab : styles.tab}>
            Manual entry
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab("json")}>
          <Text style={activeTab === "json" ? styles.activeTab : styles.tab}>
            Json import
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab("manage")}>
          <Text style={activeTab === "manage" ? styles.activeTab : styles.tab}>
            Manage
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        
        {/* MANUAL TAB (simple for now) */}
       {activeTab === "manual" && (
            <View style={styles.card}>

              {/* SECTION */}
              <Text style={styles.label}>Section</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={manualForm.section}
                    onValueChange={(itemValue) =>
                      setManualForm({
                        ...manualForm,
                        section: itemValue,
                      })
                    }
                  >
                    <Picker.Item label="Select Section" value="" />

                    <Picker.Item
                      label="Vocabulary & Kanji"
                      value="Vocabulary & Kanji"
                    />

                    <Picker.Item
                      label="Grammar & Reading"
                      value="Grammar & Reading"
                    />

                    <Picker.Item
                      label="Listening"
                      value="Listening"
                    />
                  </Picker>
                </View>

              {/* DURATION */}
              <Text style={styles.label}>Time Duration</Text>
              <TextInput
                style={styles.input}
                placeholder="Minutes"
                keyboardType="numeric"
                value={manualForm.duration}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, duration: text })
                }
              />

              {/* MONDAI */}
              <Text style={styles.label}>Mondai Title</Text>
              <TextInput
                style={styles.input}
                placeholder="もんだい 1"
                value={manualForm.mondai_title}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, mondai_title: text })
                }
              />

              {/* INSTRUCTION */}
              <Text style={styles.label}>Instruction</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                multiline
                value={manualForm.instruction}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, instruction: text })
                }
              />

              {/* PASSAGE */}
              <Text style={styles.label}>Passage Text (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                multiline
                value={manualForm.passage_text}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, passage_text: text })
                }
              />

              {/* QUESTION */}
              <Text style={styles.label}>Question</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                multiline
                value={manualForm.question}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, question: text })
                }
              />

              {/* OPTIONS */}
              <Text style={styles.label}>Option 1</Text>
              <TextInput
                style={styles.input}
                value={manualForm.option1}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, option1: text })
                }
              />

              <Text style={styles.label}>Option 2</Text>
              <TextInput
                style={styles.input}
                value={manualForm.option2}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, option2: text })
                }
              />

              <Text style={styles.label}>Option 3</Text>
              <TextInput
                style={styles.input}
                value={manualForm.option3}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, option3: text })
                }
              />

              <Text style={styles.label}>Option 4</Text>
              <TextInput
                style={styles.input}
                value={manualForm.option4}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, option4: text })
                }
              />

              {/* CORRECT ANSWER */}
              <Text style={styles.label}>Correct Option</Text>
              <TextInput
                style={styles.input}
                placeholder="1-4"
                keyboardType="numeric"
                value={manualForm.correct_option}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, correct_option: text })
                }
              />

              {/* IMAGE URL */}
              <Text style={styles.label}>Image URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={manualForm.image_url}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, image_url: text })
                }
              />

              {/* AUDIO URL */}
              <Text style={styles.label}>Audio URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={manualForm.audio_url}
                onChangeText={(text) =>
                  setManualForm({ ...manualForm, audio_url: text })
                }
              />

              {/* SAVE BUTTON */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleManualSave}
              >
                <Text style={styles.saveBtnText}>
                  Save Question
                </Text>
              </TouchableOpacity>

            </View>
          )}

        {/* JSON TAB */}
        {activeTab === "json" && (
          <View style={styles.card}>
            <Text>JSON Import (Coming Soon)</Text>
          </View>
        )}

        {/* MANAGE TAB */}
        {activeTab === "manage" && (
          <View>
            {questions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  No questions available for this test.
                </Text>
                <Text style={styles.emptySub}>
                  Use Manual Entry or JSON Import to add questions.
                </Text>
              </View>
            ) : (
              Object.entries(groupQuestions(questions))
                .sort(
                  ([a], [b]) =>
                    sectionOrder.indexOf(a) -
                    sectionOrder.indexOf(b)
                ).map(
                ([section, mondaiGroup]: any) => (
                  <View key={section} style={{ marginBottom: 20 }}>
                    
                    {/* SECTION */}
                    <Text style={styles.sectionHeader}>
                      {section.toUpperCase()}
                    </Text>

                    {section === "Listening" &&
                      (Object.values(mondaiGroup)[0] as any)?.audio_url ? (
                        <View style={styles.audioContainer}>

                          <AudioPlayer
                            uri={(Object.values(mondaiGroup)[0] as any)?.audio_url}
                          />

                          <Text style={styles.urlText}>
                            {(Object.values(mondaiGroup)[0] as any)?.audio_url}
                          </Text>

                          <TouchableOpacity
                            onPress={() =>
                              router.push({
                                pathname: "/admin/edit-audio",
                                params: {
                                  section_id:
                                    (Object.values(mondaiGroup)[0] as any)?.section_id,
                                  audio_url:
                                    (Object.values(mondaiGroup)[0] as any)?.audio_url,
                                },
                              })
                            }
                          >
                            <Text style={styles.editInstruction}>
                              ✏️ Edit Audio URL
                            </Text>
                          </TouchableOpacity>

                        </View>
                    ) : null}

                    {Object.entries(mondaiGroup).map(
                      ([mondai, data]: any) => (
                        <View key={mondai}>
                          <View style={styles.mondaiRow}>
                            <Text style={styles.mondai}>
                              {mondai}
                            </Text>

                            <TouchableOpacity
                              onPress={() =>
                                router.push({
                                  pathname: "/admin/edit-instruction",
                                  params: {
                                    group_id: data.group_id,
                                    instruction: data.instruction,
                                  },
                                })
                              }
                            >
                              <Text style={styles.editInstruction}>
                                ✏️ Edit
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.instruction}>
                            {data.instruction}
                          </Text>

                          {data.passage_text &&
                            data.passage_text.trim() !== "" ? (
                              <View style={styles.passageContainer}>

                                <Text style={styles.passage}>
                                  {data.passage_text}
                                </Text>

                                <TouchableOpacity
                                  onPress={() =>
                                    router.push({
                                      pathname: "/admin/edit-passage",
                                      params: {
                                        group_id: data.group_id,
                                        passage_text: data.passage_text,
                                      },
                                    })
                                  }
                                >
                                  <Text style={styles.editInstruction}>
                                    ✏️ Edit Passage
                                  </Text>
                                </TouchableOpacity>

                              </View>
                            ) : null}

                          {data.questions.map((q: any) => (
                            <View key={q.id} style={styles.qCard}>
                              
                              <Text style={styles.qText}>
                                {q.question}
                              </Text>

                              {q.image_url ? (
                                <View style={styles.imageContainer}>

                                  <Image
                                    source={{ uri: q.image_url }}
                                    style={styles.questionImage}
                                    resizeMode="contain"
                                  />

                                  <Text style={styles.urlText}>
                                    {q.image_url}
                                  </Text>

                                  <TouchableOpacity
                                    onPress={() =>
                                      router.push({
                                        pathname: "/admin/edit-image",
                                        params: {
                                          question_id: q.id,
                                          image_url: q.image_url,
                                        },
                                      })
                                    }
                                  >
                                    <Text style={styles.editInstruction}>
                                      ✏️ Edit Image URL
                                    </Text>
                                  </TouchableOpacity>

                                </View>
                              ) : null}

                              {q.options?.map((opt: string, i: number) => (
                                <Text key={i} style={styles.option}>
                                  {opt}
                                </Text>
                              ))}

                              <Text style={styles.answer}>
                                Answer: {q.options?.[q.correct_option - 1] || "N/A"}
                              </Text>

                              <View style={styles.actions}>
                                <TouchableOpacity
                                  style={styles.editBtn}
                                  onPress={() => handleEdit(q)}
                                >
                                  <Text style={styles.btnText}>Edit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.deleteBtn}
                                  onPress={() => handleDelete(q.id)}
                                >
                                  <Text style={styles.btnText}>Delete</Text>
                                </TouchableOpacity>
                              </View>

                            </View>
                          ))}
                        </View>
                      )
                    )}
                  </View>
                )
              )
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  back: {
    color: "#fff",
  },

  title: {
    color: "#fff",
    fontWeight: "600",
    marginTop: 8,
  },

  subtitle: {
    color: "#ddd",
    fontSize: 12,
  },

  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    margin: 16,
    backgroundColor: "#eee",
    borderRadius: 20,
    padding: 6,
  },

  tab: {
    color: "#777",
    paddingHorizontal: 10,
  },

  activeTab: {
    color: "#fff",
    backgroundColor: "#6a5ae0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },

  emptyBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },

  emptyText: {
    fontWeight: "600",
  },

  emptySub: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
  },

  sectionHeader: {
    fontWeight: "700",
    fontSize: 16,
  },

  mondai: {
    fontWeight: "600",
    marginTop: 8,
  },

  qCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },

  qText: {
    fontWeight: "600",
  },

  option: {
    fontSize: 12,
    color: "#555",
  },

  answer: {
    marginTop: 5,
    fontSize: 12,
    color: "green",
  },

  actions: {
    flexDirection: "row",
    marginTop: 10,
  },

  editBtn: {
    backgroundColor: "#3498db",
    padding: 6,
    borderRadius: 6,
    marginRight: 10,
  },

  deleteBtn: {
    backgroundColor: "#e74c3c",
    padding: 6,
    borderRadius: 6,
  },

  btnText: {
    color: "#fff",
    fontSize: 12,
  },

  instruction: {
  fontSize: 12,
  color: "#666",
  marginBottom: 10,
  },

  mondaiRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

editInstruction: {
  color: "#3498db",
  fontWeight: "600",
},

passage: {
  backgroundColor: "#eef3ff",
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
  color: "#333",
},

passageContainer: {
  backgroundColor: "#eef3ff",
  padding: 12,
  borderRadius: 10,
  marginBottom: 12,
  marginTop: 6,
},

audioContainer: {
  backgroundColor: "#f5f5f5",
  padding: 10,
  borderRadius: 10,
  marginBottom: 10,
  marginTop: 10,
},

urlText: {
  fontSize: 12,
  color: "#666",
  marginTop: 6,
},

imageContainer: {
  marginTop: 10,
},

questionImage: {
  width: "100%",
  height: 200,
  borderRadius: 10,
  backgroundColor: "#eee",
},

label: {
  fontWeight: "600",
  marginTop: 12,
  marginBottom: 4,
},

input: {
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 8,
  padding: 10,
},

textarea: {
  minHeight: 90,
  textAlignVertical: "top",
},

saveBtn: {
  backgroundColor: "#6a5ae0",
  marginTop: 20,
  padding: 14,
  borderRadius: 10,
  alignItems: "center",
},

saveBtnText: {
  color: "#fff",
  fontWeight: "700",
},

pickerContainer: {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 8,
  backgroundColor: "#fff",
  overflow: "hidden",
  marginBottom: 10,
},

});