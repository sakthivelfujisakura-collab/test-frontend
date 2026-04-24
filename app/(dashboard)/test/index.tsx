import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  AppState,
  FlatList,
} from 'react-native';
import debounce from "lodash.debounce";
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import RenderHTML from 'react-native-render-html';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import axios, { AxiosError } from "axios";

import {
  getSession,
  submitAnswer,
  submitSession,
} from '@/services/api';
import { Stack } from 'expo-router';

/* ========================= CONFIG ========================= */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

if (!BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not defined');
}

const formatTime = (secs: number) => {
  if (!Number.isFinite(secs) || secs < 0) {
    return "00:00";
  }

  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");

  return `${m}:${s}`;
};

const resolveMediaUrl = (url?: string) => {
  if (!url) return undefined;

  // Cloudinary or full URL
  if (url.startsWith('http')) {
    return url;
  }

  // Backend relative URL
  return `${BASE_URL}${url}`;
};

/* ========================= MEMOIZED QUESTION CARD ========================= */

const MemoizedQuestionCard = React.memo(({ q, qIdx, width, currentAnswer, handleChoose, onLayout }: any) => {
  return (
    <View
      style={styles.qCard}
      onLayout={onLayout}
    >
      <RenderHTML
        contentWidth={width - 32}
        source={{
          html: `<p>${qIdx + 1}. ${q.text}</p>`,
        }}
      />

      {q.image_url && (
        <Image
          source={{
            uri: resolveMediaUrl(q.image_url),
          }}
          style={styles.questionImage}
          resizeMode="contain"
        />
      )}

      <View style={{ marginTop: 10 }}>
        {q.options
          .filter((opt: any) => opt?.text?.trim())
          .map((opt: any, idx: number) => {
            const optionValue = idx + 1;
            const isSelected = currentAnswer === optionValue;
            return (
              <TouchableOpacity
                key={opt.id}
                style={styles.radioRow}
                onPress={() => handleChoose(q.id, idx)}
              >
                <View style={styles.radioOuter}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                <Text style={{ flex: 1 }}>
                  {opt.text}
                </Text>
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );
});

/* ========================= SCREEN ========================= */

export default function TestScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const navigation = useNavigation();
  const numericSessionId = Number(sessionId);
  const { width } = useWindowDimensions();

  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null); // always up-to-date ref used by unmount cleanup
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const hasSwitchedAppRef = useRef(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const effectiveStartRef = useRef<number>(0);   // wall-clock ms when test began
  const durationMsRef = useRef<number>(0);        // total test duration in ms
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRefs = useRef<Record<number, ScrollView | null>>({});

  // Layout tracking for auto-scroll
  const groupLayoutsRef = useRef<Record<number, number>>({});
  const questionLayoutsRef = useRef<Record<number, { groupId: number, y: number }>>({});

  /* ========================= LOAD SESSION ========================= */

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSession(numericSessionId);
        const restored: Record<number, number> = {};

        res.data.answers?.forEach((a: any) => {
          restored[a.question_id] = a.chosen_option;
        });

        setAnswers(restored);

        console.log(
          '📦 RAW QUESTION DATA:',
          res.data.set.sections[0].groups[0].questions[0]
        );

        setSession(res.data);

        const rawStart = new Date(res.data.start_time).getTime();
        const start = !isNaN(rawStart) && rawStart > 0 ? rawStart : Date.now();
        const totalMinutes =
          Number(res.data.total_time_minutes) ||
          Number(res.data.set?.total_time_minutes);
        const durationMs = totalMinutes * 60 * 1000;

        // Store in refs so AppState handler can recalculate even when
        // session.start_time is null from the API
        effectiveStartRef.current = start;
        durationMsRef.current = durationMs;

        if (!durationMs || isNaN(durationMs)) {
          console.warn('⚠️ Could not compute remaining time — durationMs:', durationMs);
          setRemaining(0);
        } else {
          const now = Date.now();
          const remainingSeconds = Math.floor((start + durationMs - now) / 1000);
          setRemaining(Math.max(remainingSeconds, 0));
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not load test');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [sessionId]);

  /* ========================= NAVIGATION RESTRICTION ========================= */

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {

      if (submitting || submitLock.current) {
        return; // allow navigation when already submitting
      }

      e.preventDefault();

      Alert.alert(
        'Leave Test',
        'Are you sure you want to leave the test? Your answers will be submitted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            style: 'destructive',
            onPress: () => {
              handleSubmit(false);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, submitting]);

  /* ========================= SESSION TIMER ========================= */

  useEffect(() => {

    const subscription = AppState.addEventListener("change", (state) => {

      if (state === "background" || state === "inactive") {
        hasSwitchedAppRef.current = true;
      }

      if (state === "active") {
        if (effectiveStartRef.current && durationMsRef.current) {
          // Always recalculate from wall clock — this corrects for any time
          // the app spent in the background where setInterval was paused
          const now = Date.now();
          const remainingSeconds = Math.floor(
            (effectiveStartRef.current + durationMsRef.current - now) / 1000
          );
          setRemaining(Math.max(remainingSeconds, 0));
        }

        if (hasSwitchedAppRef.current) {
          Alert.alert(
            "Warning",
            "You navigated away from the test. Please do not switch apps or minimize the screen during the exam.",
            [{ text: "I Understand", style: "default" }]
          );
          hasSwitchedAppRef.current = false;
        }
      }

    });

    return () => subscription.remove();

  }, []);

  /* ========================= TIMER ========================= */

  useEffect(() => {
    if (remaining <= 0 || timerRef.current) return;

    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          handleSubmit(true);
          return 0;
        }

        return r - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [remaining]);

  /* ========================= AUDIO CLEANUP ========================= */

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });
  }, []);

  // Keep soundRef in sync with the sound state so the unmount cleanup
  // below always has a live (non-stale) reference to the Audio.Sound object.
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // Unmount cleanup — stop & unload audio so it doesn't keep playing on the
  // result screen.  We use soundRef (not sound) to avoid the stale-closure
  // bug that was the original cause of this issue.
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => { });
        soundRef.current.unloadAsync().catch(() => { });
        soundRef.current = null;
      }
    };
  }, []);

  /* ========================= DATA ========================= */

  const sections = useMemo(() => {
    return session?.set?.sections ?? [];
  }, [session]);

  const activeSection = sections[activeTab] || { groups: [] };

  /* ========================= SECTION CHANGE BEHAVIORS ========================= */

  useEffect(() => {
    // 1. Scroll vertical list to top when changing tabs programmatically
    scrollViewRefs.current[activeTab]?.scrollTo({ y: 0, animated: false });

    // (Note: Syncing FlatList horizontal scroll is now done inside button onPress to prevent gesture feedback loops)

    // 2. Reset Audio
    const resetAudio = async () => {
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (e) { }
      }

      setSound(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    };

    resetAudio();
  }, [activeTab]);

  useEffect(() => {
    if (activeSection?.audio_url) {
      playAudio(activeSection.audio_url);
    }
  }, [activeTab]);

  /* ========================= SWIPE GESTURE ========================= */
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== null && newIndex !== undefined) {
        setActiveTab((prev) => (prev !== newIndex ? newIndex : prev));
      }
    }
  }).current;

  /* ========================= HELPERS ========================= */

  const playAudio = async (uri: string) => {
    try {
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) { }
      }

      const finalUri = uri.startsWith('http')
        ? uri
        : `${BASE_URL}${uri}`;

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: finalUri },
        { shouldPlay: false } // 🔥 do NOT auto play
      );

      setSound(newSound);

      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
        setPosition(0);
      }

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        setPosition(status.positionMillis || 0);
        setDuration(status.durationMillis || 0);
        setIsPlaying(status.isPlaying);

        if (status.didJustFinish) {
          setIsPlaying(false);
          setPosition(0);
        }
      });

    } catch (err) {
      console.error('❌ Audio error', err);
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const saveAnswerDebounced = useMemo(
    () =>
      debounce(async (questionId: number, option: number | null) => {
        try {
          await submitAnswer(numericSessionId, {
            question_id: questionId,
            chosen_option: option,
          });
        } catch {
          console.log("autosave failed");
        }
      }, 500),
    [numericSessionId]
  );

  const handleChoose = (questionId: number, optionIndex: number) => {
    setAnswers(prev => {
      const current = prev[questionId];

      let updated;

      if (current === optionIndex + 1) {
        // deselect
        updated = { ...prev };
        delete updated[questionId];

        saveAnswerDebounced(questionId, null);
        return updated;
      }

      updated = {
        ...prev,
        [questionId]: optionIndex + 1,
      };

      saveAnswerDebounced(questionId, optionIndex + 1);

      // Auto-scroll to next question
      setTimeout(() => {
        if (!activeSection?.groups) return;
        const ids = activeSection.groups.reduce((acc: number[], g: any) =>
          acc.concat(g.questions.map((q: any) => q.id)),
          []);

        const idx = ids.indexOf(questionId);
        if (idx !== -1 && idx < ids.length - 1) {
          const nextQId = ids[idx + 1];
          const qLayout = questionLayoutsRef.current[nextQId];
          if (qLayout) {
            const groupY = groupLayoutsRef.current[qLayout.groupId] || 0;
            const totalY = groupY + qLayout.y;
            // Scroll down to the next question, leaving a little top margin
            scrollViewRefs.current[activeTab]?.scrollTo({ y: Math.max(0, totalY - 80), animated: true });
          }
        }
      }, 400); // 400ms delay so user can see their selection before it moves

      return updated;
    });
  };

  const handleChooseRef = useRef(handleChoose);
  handleChooseRef.current = handleChoose;

  const stableHandleChoose = useCallback((questionId: number, optionIndex: number) => {
    handleChooseRef.current(questionId, optionIndex);
  }, []);

  const handleSubmit = (auto = false) => {

    if (submitLock.current) {
      console.log("⚠️ Submit already triggered");
      return;
    }

    const doSubmit = async () => {
      try {

        submitLock.current = true; // 🔒 immediate lock
        setSubmitting(true);

        await submitSession(numericSessionId);

        // Stop audio before navigating
        if (sound) {
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
          } catch (e) { }
        }

        router.replace({
          pathname: '/test-result',
          params: { sessionId: numericSessionId },
        });

      } catch (e: any) {

        if (e?.response?.data?.detail === "session already submitted") {
          // Stop audio before navigating
          if (sound) {
            try {
              await sound.stopAsync();
              await sound.unloadAsync();
            } catch (e) { }
          }

          router.replace({
            pathname: '/test-result',
            params: { sessionId: numericSessionId },
          });
          return;
        }

        console.error("❌ submit error", e);
        Alert.alert("Error", "Submit failed");

        submitLock.current = false; // allow retry if failed
        setSubmitting(false);
      }
    };

    if (auto) {
      doSubmit();
      return;
    }

    Alert.alert(
      "Submit Test",
      "Are you sure you want to submit?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "destructive",
          onPress: doSubmit,
        },
      ],
      { cancelable: false }
    );
  };

  /* ========================= RENDER ========================= */

  return (
    <>
      <Stack.Screen
        options={{
          title: 'JLPT Test',
          headerTitleAlign: 'left',

          headerStyle: {
            backgroundColor: '#6C7CFF',
          },

          headerTitleStyle: {
            color: '#fff',
            fontWeight: '700',
          },

          headerTintColor: '#fff',

          headerRight: () => loading ? null : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: '#E0E0FF',
                    letterSpacing: 1,
                  }}
                >
                  TIME LEFT
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: remaining <= 60 ? '#FF3B30' : '#fff',
                  }}
                >
                  {formatTime(remaining)}
                </Text>
              </View>

              <TouchableOpacity
                disabled={submitting}
                onPress={() => handleSubmit(false)}
                style={{
                  backgroundColor: '#fff',
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: '#6C7CFF', fontWeight: '700' }}>
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      {loading ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* TOP BAR 
      <View style={styles.topBar}>
        <Text style={styles.topText}>
          Time Left: {formatTime(remaining)}
        </Text>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => handleSubmit(false)}
        >
          <Text style={{ color: '#fff' }}>Submit</Text>
        </TouchableOpacity>
      </View>*/}

          {/* SECTION TABS */}
          <View style={styles.segmentContainer}>
            {sections.map((s: any, idx: number) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.segmentButton,
                  idx === activeTab && styles.activeSegment,
                ]}
                onPress={() => {
                  setActiveTab(idx);
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true });
                }}
              >
                <Text
                  style={{
                    fontWeight: '600',
                    color: idx === activeTab ? '#fff' : '#6C7CFF',
                    textAlign: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {s.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* QUESTIONS */}
          {activeSection.audio_url && (
            <View style={styles.stickyPlayer}>

              <TouchableOpacity onPress={togglePlayback}>
                <Text style={styles.playIcon}>
                  {isPlaying ? '❚❚' : '▶'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.playerTime}>
                {formatTime(Math.floor(position / 1000))}
              </Text>

              <Slider
                style={{ flex: 1, marginHorizontal: 8 }}
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                minimumTrackTintColor="#6C7CFF"
                maximumTrackTintColor="#D6DBFF"
                thumbTintColor="#6C7CFF"
                onSlidingComplete={async (value) => {
                  if (sound) {
                    await sound.setPositionAsync(value);
                  }
                }}
              />

              <Text style={styles.playerTime}>
                {formatTime(Math.floor(duration / 1000))}
              </Text>

            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={sections}
            keyExtractor={(item, idx) => `section-${idx}`}
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
            renderItem={({ item: sectionInfo, index: sIdx }) => (
              <ScrollView
                ref={(ref) => { scrollViewRefs.current[sIdx] = ref; }}
                style={[styles.qList, { width }]}
                contentContainerStyle={{ padding: 12, paddingTop: sectionInfo.audio_url ? 90 : 12 }}
              >
                {sectionInfo.groups.map((group: any, gIdx: number) => (
                  <View
                    key={group.id}
                    style={{ marginBottom: 18 }}
                    onLayout={(e) => {
                      groupLayoutsRef.current[group.id] = e.nativeEvent.layout.y;
                    }}
                  >
                    <Text style={styles.groupTitle}>
                      {group.title || `もんだい ${gIdx + 1}`}
                    </Text>

                    {group.instructions && (
                      <Text style={styles.instructions}>
                        {group.instructions}
                      </Text>
                    )}

                    {group.passage_text && (
                      <View style={styles.passageBox}>
                        <Text>{group.passage_text}</Text>
                      </View>
                    )}

                    {group.passage_image_url && (
                      <Image
                        source={{
                          uri: resolveMediaUrl(
                            group.passage_image_url
                          ),
                        }}
                        style={styles.passageImage}
                        resizeMode="contain"
                      />
                    )}

                    {group.questions.map((q: any, qIdx: number) => (
                      <MemoizedQuestionCard
                        key={q.id}
                        q={q}
                        qIdx={qIdx}
                        width={width}
                        currentAnswer={answers[q.id]}
                        handleChoose={stableHandleChoose}
                        onLayout={(e: any) => {
                          questionLayoutsRef.current[q.id] = {
                            groupId: group.id,
                            y: e.nativeEvent.layout.y
                          };
                        }}
                      />
                    ))}
                  </View>
                ))}

                {/* ── Next Section / End of Test hint ── */}
                {sIdx < sections.length - 1 ? (
                  <TouchableOpacity
                    style={styles.nextSectionBtn}
                    onPress={() => {
                      setActiveTab(sIdx + 1);
                      flatListRef.current?.scrollToIndex({ index: sIdx + 1, animated: true });
                    }}
                  >
                    <Text style={styles.nextSectionBtnText}>
                      {sections[sIdx + 1]?.title
                        ? `Next: ${sections[sIdx + 1].title}  →`
                        : 'Next Section  →'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.endHint}>
                    <Text style={styles.endHintText}>
                      You've completed all sections. Tap  Submit  when ready.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          />
        </View>
      )}
    </>
  );
}

/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // topBar: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   padding: 12,
  //   backgroundColor: '#fff',
  //   borderBottomWidth: 1,
  //   borderColor: '#eee',
  // },

  // topText: { fontWeight: '700' },

  // submitBtn: {
  //   backgroundColor: '#ff5a5f',
  //   padding: 8,
  //   borderRadius: 8,
  // },

  tabBar: {
    flexGrow: 0,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 80,
  },

  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6C7CFF',
    marginRight: 10,
  },

  activeTab: {
    backgroundColor: '#6C7CFF',
  },

  timeBadge: {
    marginTop: 4,
    color: '#888',
  },

  qList: { flex: 1 },

  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },

  instructions: {
    marginBottom: 8,
    color: '#444',
  },

  passageBox: {
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  passageImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#eee',
  },

  qCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },

  questionImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#eee',
  },

  optBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 8,
  },

  audioBtn: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },

  audioBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6C7CFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6C7CFF',
  },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E9EDFF',
    borderRadius: 30,
    padding: 4,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },

  segmentButton: {
    flex: 1,
    minWidth: 0,
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


  playText: {
    fontWeight: '700',
    color: '#6C7CFF',
  },

  stickyPlayer: {
    position: 'absolute',
    top: 80, // adjust slightly if needed
    left: 12,
    right: 12,
    height: 55,
    backgroundColor: '#F3F6FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 50,
    elevation: 8,
  },

  playIcon: {
    fontSize: 18,
    color: '#6C7CFF',
    fontWeight: '700',
  },

  playerTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C7CFF',
    width: 45,
    textAlign: 'center',
  },

  timeText: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
  },

  nextSectionBtn: {
    marginTop: 8,
    marginBottom: 32,
    marginHorizontal: 4,
    backgroundColor: '#6C7CFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#6C7CFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  nextSectionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.4,
  },

  endHint: {
    marginTop: 8,
    marginBottom: 32,
    marginHorizontal: 4,
    backgroundColor: '#E9EDFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
  },

  endHintText: {
    color: '#6C7CFF',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },

});