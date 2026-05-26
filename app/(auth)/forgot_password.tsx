import { colors } from '@/constants/colors';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const LOGIN_PATH = '/users/forgot-password';
const VERIFY_OTP_PATH = '/users/verify-otp';
const RESET_PASSWORD_PATH = '/users/reset-password';

export default function ForgotPasswordOneScreen() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const otpRefs = useRef<(TextInput | null)[]>([]);

    /* ================= OTP HELPERS ================= */

    function clearOtpAndFocusFirst() {
        setOtp(['', '', '', '']);
        setTimeout(() => {
            otpRefs.current[0]?.focus();
        }, 50);
    }

    /* ================= API CALLS ================= */

    async function sendOtp() {
        if (loading) return;

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}${LOGIN_PATH}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.detail || 'Failed to send OTP');

            setStep(2);
            clearOtpAndFocusFirst();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Network error');
        } finally {
            setLoading(false);
        }
    }

    async function verifyOtp() {
        if (loading) return;

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}${VERIFY_OTP_PATH}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    otp: otp.join(''),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                clearOtpAndFocusFirst();
                throw new Error(data?.detail || 'Invalid OTP');
            }

            clearOtpAndFocusFirst();
            setStep(3);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    }

    async function resetPassword() {
        if (loading) return;

        if (password !== confirm) {
            alert('Passwords do not match');
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}${RESET_PASSWORD_PATH}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.detail || 'Password reset failed');

            router.push('/login');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Reset failed');
        } finally {
            setLoading(false);
        }
    }

    /* ================= UI ================= */

    return (
        <>
            {/* header  */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    {/* <Text>Profile</Text> */}
                    <Text style={styles.back}>← Back to Levels</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.container}>
                <Text style={styles.title}>Password retrieval</Text>
                <Text style={styles.subtitle}>
                    Did you forget your password? Don’t worry.
                </Text>

                {/* STEP 1 – EMAIL */}
                {step === 1 && (
                    <>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            placeholder="Enter registered email"
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <TouchableOpacity
                            style={[styles.button, loading && { opacity: 0.6 }]}
                            onPress={sendOtp}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Please wait...' : 'Next'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* STEP 2 – OTP */}
                {step === 2 && (
                    <>
                        <Text style={styles.label}>Enter OTP</Text>

                        <View style={styles.otpRow}>
                            {otp.map((value, i) => (
                                <TextInput
                                    key={i}
                                    ref={(ref) => {
                                        otpRefs.current[i] = ref;
                                    }}
                                    value={value}
                                    maxLength={1}
                                    keyboardType="number-pad"
                                    style={styles.otpBox}

                                    onChangeText={(text) => {
                                        const newOtp = [...otp];
                                        newOtp[i] = text;
                                        setOtp(newOtp);

                                        // TYPE → NEXT
                                        if (text && i < otp.length - 1) {
                                            otpRefs.current[i + 1]?.focus();
                                        }
                                    }}

                                    onKeyPress={({ nativeEvent }) => {
                                        if (nativeEvent.key === 'Backspace') {
                                            const newOtp = [...otp];
                                            newOtp[i] = '';
                                            setOtp(newOtp);

                                            // CLEAR → PREVIOUS
                                            if (i > 0) {
                                                setTimeout(() => {
                                                    otpRefs.current[i - 1]?.focus();
                                                }, 10);
                                            }
                                        }
                                    }}
                                />
                            ))}
                        </View>



                        <TouchableOpacity
                            style={[styles.button, loading && { opacity: 0.6 }]}
                            onPress={verifyOtp}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* STEP 3 – RESET PASSWORD */}
                {step === 3 && (
                    <>
                        <Text style={styles.label}>New Password</Text>
                        <TextInput
                            secureTextEntry
                            placeholder="Enter new password"
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                        />

                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            secureTextEntry
                            placeholder="Confirm password"
                            style={styles.input}
                            value={confirm}
                            onChangeText={setConfirm}
                        />

                        <TouchableOpacity
                            style={[styles.button, loading && { opacity: 0.6 }]}
                            onPress={resetPassword}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Updating...' : 'Change Password'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </>
    );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        color: '#6B7280',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        marginBottom: 16,
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
    },
    otpBox: {
        width: 52,
        height: 52,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 18,
    },
    button: {
        backgroundColor: colors.btnprimary,
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '600',
    },
          header: {
        backgroundColor: "#6C7CFF",
        padding: 20,
        paddingTop: 48,
        paddingBottom:10,
        // borderBottomLeftRadius: 24,
        // borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    back: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 12,
    },
});