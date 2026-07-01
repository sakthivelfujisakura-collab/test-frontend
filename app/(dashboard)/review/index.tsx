import { getTestResult } from "@/services/api";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";

/* ─── per-section audio player state ─── */
type PlayerState = {
  isPlaying: boolean;
  position: number; // ms
  duration: number; // ms
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

const formatTime = (secs: number) => {
  if (!Number.isFinite(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function ReviewScreen() {
  const { width } = useWindowDimensions();
  const { sessionId } = useLocalSearchParams();
  const [result, setResult] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "incorrect" | "unanswered">("all");
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRefs = useRef<Record<string, ScrollView | null>>({});

  const filters: Array<"all" | "incorrect" | "unanswered"> = ["all", "incorrect", "unanswered"];

  /* ─── audio ─── */
  const soundRef = useRef<Audio.Sound | null>(null);
  const activeSectionIdRef = useRef<number | null>(null);
  const [playerStates, setPlayerStates] = useState<Record<number, PlayerState>>({});

  // 1️⃣ Load test result
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      console.log("👉 SESSION ID:", sessionId);

      const res = await getTestResult(Number(sessionId));

      console.log("👉 FULL API RESPONSE:", res);
      console.log("👉 RESPONSE.DATA:", res?.data);
      console.log("👉 SECTIONS:", res?.data?.set?.sections);

      setResult(res.data);
    } catch (err) {
      console.error("❌ Failed to load review", err);
    }
  };

  // 2️⃣ Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Handle filter changes (Stop audio & Scroll to top)
  useEffect(() => {
    const stopAudioAndScroll = async () => {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (e) { }
        soundRef.current = null;

        // Reset player states so play button resets to ▶
        setPlayerStates((prev) => {
          const next = { ...prev };
          if (activeSectionIdRef.current) {
            next[activeSectionIdRef.current] = {
              isPlaying: false,
              position: 0,
              duration: 0
            };
          }
          return next;
        });
        activeSectionIdRef.current = null;
      }

      // 1. Scroll vertical child list to top
      scrollViewRefs.current[filter]?.scrollTo({ y: 0, animated: false });

      // (Note: Syncing FlatList horizontal scroll is now done inside button onPress to prevent gesture feedback loops)

    };

    stopAudioAndScroll();
  }, [filter]);

  // 3️⃣ Load (but don't auto-play) audio for a section
  const loadSectionAudio = async (sectionId: number, uri: string) => {
    try {
      // Stop + unload whatever was playing before
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      activeSectionIdRef.current = sectionId;

      // Reset player state for this section
      setPlayerStates((prev) => ({
        ...prev,
        [sectionId]: { isPlaying: false, position: 0, duration: 0 },
      }));

      const finalUri = uri.startsWith("http") ? uri : `${BASE_URL}${uri}`;

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: finalUri },
        { shouldPlay: false }
      );

      soundRef.current = newSound;

      if (status.isLoaded) {
        setPlayerStates((prev) => ({
          ...prev,
          [sectionId]: {
            isPlaying: false,
            position: 0,
            duration: status.durationMillis ?? 0,
          },
        }));
      }

      newSound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        const sid = activeSectionIdRef.current;
        if (sid === null) return;

        setPlayerStates((prev) => ({
          ...prev,
          [sid]: {
            isPlaying: s.isPlaying,
            position: s.positionMillis ?? 0,
            duration: s.durationMillis ?? prev[sid]?.duration ?? 0,
          },
        }));

        if (s.didJustFinish) {
          setPlayerStates((prev) => ({
            ...prev,
            [sid]: { ...prev[sid], isPlaying: false, position: 0 },
          }));
        }
      });
    } catch (err) {
      console.error("❌ Audio error", err);
    }
  };

  // 4️⃣ Toggle play / pause
  const togglePlayback = async (sectionId: number, uri: string) => {
    // If a different section is active, load this one first
    if (activeSectionIdRef.current !== sectionId || !soundRef.current) {
      await loadSectionAudio(sectionId, uri);
      await soundRef.current?.playAsync();
      return;
    }

    const state = playerStates[sectionId];
    if (state?.isPlaying) {
      await soundRef.current?.pauseAsync();
    } else {
      await soundRef.current?.playAsync();
    }
  };

  /* ─── swipe gesture ─── */
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const newFilter = viewableItems[0].item;
      if (newFilter) {
        setFilter((prev) => (prev !== newFilter ? newFilter : prev));
      }
    }
  }).current;

  return (
    <>
      {/* 🔹 Header */}
      <Stack.Screen
        options={{
          title: "Review Answers",
          headerStyle: { backgroundColor: "#6C7CFF" },
          headerTintColor: "#fff",
        }}
      />

      {/* 🔹 Loading */}
      {!result ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C7CFF" />
          <Text style={{ marginTop: 12, fontWeight: "600" }}>Loading Review...</Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* FILTER BAR (Fixed at top) */}
          <View style={styles.segmentContainer}>
            {(["all", "incorrect", "unanswered"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.segmentButton, filter === f && styles.activeSegment]}
                onPress={() => {
                  setFilter(f);
                  const idx = filters.indexOf(f);
                  if (idx !== -1) {
                    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
                  }
                }}
              >
                <Text
                  style={{
                    fontWeight: '600',
                    color: filter === f ? '#fff' : '#6C7CFF',
                    textAlign: 'center',
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            ref={flatListRef}
            data={filters}
            keyExtractor={(item) => item}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item: currentFilter }) => {

              // ✅ MOVE LOGIC HERE (outside JSX)
              const allSections = result?.set?.sections ?? [];

              const hasAnyQuestions = allSections.some((section: any) =>
                (section.questions ?? []).some((q: any) => {
                  const isUnanswered =
                    q.chosen_option === null || q.chosen_option === undefined;
                  const isIncorrect = !isUnanswered && !q.is_correct;

                  if (currentFilter === "incorrect") return isIncorrect;
                  if (currentFilter === "unanswered") return isUnanswered;
                  return true;
                })
              );

              return (
                <ScrollView
                  ref={(ref) => { scrollViewRefs.current[currentFilter] = ref; }}
                  style={[styles.qList, { width }]}
                  contentContainerStyle={styles.qListContent}
                >

                  {/* ✅ GLOBAL EMPTY MESSAGE */}
                  {!hasAnyQuestions && (
                    <View style={{ padding: 20, alignItems: "center" }}>
                      <Text style={{ fontWeight: "600", color: "#666" }}>
                        {currentFilter === "incorrect"
                          ? "No incorrect answers found 🎉"
                          : currentFilter === "unanswered"
                            ? "All questions are answered ✅"
                            : "No questions available"}
                      </Text>
                    </View>
                  )}
                  {/* SECTIONS */}
                  {(result?.set?.sections ?? []).map((section: any) => {

                    // ✅ STEP 1: Filter questions FIRST
                    const filteredQuestions = (section.questions ?? []).filter((q: any) => {
                      const isUnanswered =
                        q.chosen_option === null || q.chosen_option === undefined;
                      const isIncorrect = !isUnanswered && !q.is_correct;

                      if (currentFilter === "incorrect") return isIncorrect;
                      if (currentFilter === "unanswered") return isUnanswered;
                      return true; // "all"
                    });

                    // ✅ STEP 2: Hide empty sections (important)
                    if (currentFilter !== "all" && filteredQuestions.length === 0) {
                      return null;
                    }

                    const ps: PlayerState = playerStates[section.id] ?? {
                      isPlaying: false,
                      position: 0,
                      duration: 0,
                    };

                    const isActiveSection = activeSectionIdRef.current === section.id;

                    return (
                      <View key={section.id} style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>{section.name}</Text>

                        {/* AUDIO */}
                        {section.audio_url && (
                          <View style={styles.audioPlayer}>
                            <TouchableOpacity
                              onPress={() => togglePlayback(section.id, section.audio_url)}
                              style={styles.playBtn}
                            >
                              <Text style={styles.playIcon}>
                                {isActiveSection && ps.isPlaying ? "❚❚" : "▶"}
                              </Text>
                            </TouchableOpacity>

                            <Text style={styles.playerTime}>
                              {formatTime(Math.floor((isActiveSection ? ps.position : 0) / 1000))}
                            </Text>

                            <Slider
                              style={{ flex: 1, marginHorizontal: 6 }}
                              minimumValue={0}
                              maximumValue={isActiveSection && ps.duration > 0 ? ps.duration : 1}
                              value={isActiveSection ? ps.position : 0}
                              minimumTrackTintColor="#6C7CFF"
                              maximumTrackTintColor="#C8DEFF"
                              thumbTintColor="#6C7CFF"
                              onSlidingComplete={async (value) => {
                                if (isActiveSection && soundRef.current) {
                                  await soundRef.current.setPositionAsync(value);
                                }
                              }}
                            />

                            <Text style={styles.playerTime}>
                              {formatTime(Math.floor((isActiveSection ? ps.duration : 0) / 1000))}
                            </Text>
                          </View>
                        )}

                        {/* QUESTIONS */}
                        {filteredQuestions.map((q: any, idx: number) => {
                          return (
                            <View key={q.id} style={styles.qCard}>
                              <View style={{ marginBottom: 8 }}>
                                <RenderHtml
                                  contentWidth={width}
                                  source={{
                                    html: `<div><strong>${idx + 1}.</strong> ${q.question}</div>`,
                                  }}
                                />
                              </View>

                              {/* OPTIONS */}
                              {(q.options ?? []).map((opt: string, i: number) => {
                                if (!opt) return null;

                                const optionValue = i + 1;
                                const isCorrect = optionValue === q.correct_option;
                                const isSelected = optionValue === q.chosen_option;

                                let bg = "#fff";
                                if (isCorrect) bg = "#D4F8E8";
                                else if (isSelected && !q.is_correct) bg = "#FDEAEA";

                                return (
                                  <View
                                    key={i}
                                    style={[styles.optionBox, { backgroundColor: bg }]}
                                  >
                                    <Text>{opt}</Text>
                                  </View>
                                );
                              })}

                              {/* EXPLANATION */}
                              {!q.is_correct && q.explanation && (
                                <View style={styles.explanationBox}>
                                  <Text style={{ fontWeight: "700", marginBottom: 4 }}>
                                    Explanation
                                  </Text>
                                  <Text>{q.explanation}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                  {/* ── BACK TO RESULTS ── */}
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                  >
                    <Text style={styles.backBtnText}>← Back to Results</Text>
                  </TouchableOpacity>
                </ScrollView>
              );
            }}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  qList: { flex: 1, backgroundColor: '#F3F6FF' },
  qListContent: { padding: 12, paddingBottom: 24 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0EDFF',
    borderRadius: 30,
    padding: 4,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },

  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },

  activeSegment: {
    backgroundColor: '#6C7CFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  sectionCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  /* ── audio track player ── */
  audioPlayer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F5FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D0DCFF",
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6C7CFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  playIcon: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },
  playerTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6C7CFF",
    width: 42,
    textAlign: "center",
  },

  qCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  questionText: {
    fontWeight: "700",
    marginBottom: 8,
  },

  optionBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 6,
  },

  explanationBox: {
    backgroundColor: "#F8F8F8",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },

  backBtn: {
    marginTop: 0,
    marginBottom: 36,
    backgroundColor: '#6C7CFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#6C7CFF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  backBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

