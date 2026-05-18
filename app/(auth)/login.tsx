// MobileLoginScreenWithAPI.tsx
import { objectImg } from '@/assets/images';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { colors } from '../../constants/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const LOGIN_PATH = '/users/signin';

export default function MobileLoginScreen({ navigation }: any) {
    const theme = useColorScheme() ?? 'light';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function saveTokensSecurely(accessToken: string, refreshToken?: string) {
        try {
            await SecureStore.setItemAsync('accessToken', accessToken);
            if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
        } catch (e) {
            console.warn('Could not save tokens to secure store', e);
        }
    }

    async function onLogin() {
        setErrorMessage(null);

        if (!email || !password) {
            setErrorMessage('Please enter email and password.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}${LOGIN_PATH}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const contentType = res.headers.get('content-type') || '';
            let data: any = null;
            if (contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(text || 'Unexpected server response');
            }

            if (!res.ok) {
                const msg = data?.message || data?.error || `Invalid email or password.`;
                throw new Error(msg);
            }

            const accessToken = data.accessToken ?? data.token ?? data?.data?.accessToken;
            const refreshToken = data.refreshToken ?? data?.data?.refreshToken;

            if (!accessToken) {
                console.warn('No access token in response', data);
                throw new Error('Invalid login response from server.');
            }

            await saveTokensSecurely(accessToken, refreshToken);

            // Navigate to tabs after successful login
            // router.replace('/(dashboard)/home');
            router.replace('/level');
        } catch (err: any) {
            setErrorMessage(err?.message || 'Login failed. Try again.');
        } finally {
            setLoading(false);
        }
    }

    // kept as a simple placeholder (UI preserved). Remove if you don't want it.
    const onGoogle = () => {
        alert('Google sign-in placeholder.');
    };

    return (
        // <ImageBackground
        //   source={{
        //     uri:
        //       'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=60',
        //   }}
        //   style={styles.bg}
        //   blurRadius={Platform.OS === 'ios' ? 10 : 2}
        // >
        <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#ffffff' }} showsVerticalScrollIndicator={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <Image
                    source={objectImg}
                    style={styles.illustration}
                    resizeMode="contain"
                />

                <View style={[styles.card]}>
                    <Text style={styles.title}>Take your Japanese Test</Text>
                    <Text style={styles.subtitle}>Enter your email and password to log in</Text>

                    {errorMessage ? <Text style={{ color: '#b00020', marginBottom: 8 }}>{errorMessage}</Text> : null}

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter registered email id"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                    />

                    <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>

                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry
                        style={styles.input}
                    />

                    <TouchableOpacity
                        style={{ alignSelf: 'flex-end', marginTop: 8 }}
                        onPress={() => router.push('/forgot_password')}
                    >
                        <Text style={styles.forgot}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.loginBtn} onPress={onLogin} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginText}>Log in</Text>}
                    </TouchableOpacity>

                    <View style={styles.orRow}>
                        <View style={styles.line} />
                        <Text style={styles.orText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity style={styles.googleBtn} onPress={onGoogle}>
                        <Image
                            source={{
                                uri:
                                    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png',
                            }}
                            style={styles.googleIcon}
                        />
                        <Text style={styles.googleText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <View style={styles.signupRow}>
                        <Text style={styles.small}>Don’t have an account?</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/signup')}>

                            <Text style={styles.signup}> Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScrollView>
        // </ImageBackg/round>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1, width: '100%', height: '100%' },
    container: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 40 },
    illustration: { width: 180, height: 120, marginBottom: -20 },
    card: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 18,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
    },
    title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 12 },
    label: { fontSize: 12, color: '#444', marginBottom: 6 },
    input: {
        backgroundColor: colors.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    forgot: { color: '#c33a57', fontSize: 12 },
    loginBtn: {
        marginTop: 18,
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    loginText: { color: '#fff', fontWeight: '600' },
    orRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
    line: { flex: 1, height: 1, backgroundColor: '#e6e6e6' },
    orText: { marginHorizontal: 10, color: '#999', fontSize: 12, backgroundColor: 'transparent' },
    googleBtn: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e6e6e6',
        borderRadius: 10,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIcon: { width: 18, height: 18, marginRight: 8 },
    googleText: { fontSize: 14 },
    signupRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    small: { color: '#888', fontSize: 12 },
    signup: { color: colors.text, fontWeight: '600' },
});