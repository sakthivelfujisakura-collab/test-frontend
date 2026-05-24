import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { colors } from '../../constants/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SIGNUP_PATH = '/users/signup';

export default function SignupScreen() {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Validation Errors
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const handleSignup = async () => {

        // Reset Errors
        setNameError('');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');

        let isValid = true;

        // Name Validation
        if (!name.trim()) {
            setNameError('Name is required');
            isValid = false;
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email.trim()) {
            setEmailError('Email is required');
            isValid = false;
        } else if (!emailRegex.test(email.trim())) {
            setEmailError('Enter valid email address');
            isValid = false;
        }

        // Strong Password Validation
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!password) {
            setPasswordError('Password is required');
            isValid = false;
        } else if (!passwordRegex.test(password)) {
            setPasswordError(
                'Password must contain 8+ characters, uppercase, lowercase, number and special character'
            );
            isValid = false;
        }

        // Confirm Password Validation
        if (!confirmPassword) {
            setConfirmPasswordError('Confirm password is required');
            isValid = false;
        } else if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            isValid = false;
        }

        // Stop API call if validation fails
        if (!isValid) return;

        try {

            setLoading(true);

            const res = await fetch(`${API_URL}${SIGNUP_PATH}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {

                let errorMessage =
                    'Unable to create account. Please try again.';

                if (typeof data.detail === 'string') {
                    errorMessage = data.detail;

                } else if (Array.isArray(data.detail)) {

                    const msg = data.detail[0]?.msg || '';

                    if (msg.toLowerCase().includes('email')) {
                        errorMessage =
                            'Please enter a valid email address';
                    } else {
                        errorMessage =
                            'Please check your details and try again';
                    }
                }

                return Alert.alert(
                    'Signup Failed',
                    errorMessage
                );
            }

            Alert.alert(
                'Success',
                'Account created successfully'
            );

            router.push('/login');

        } catch (error) {

            console.log('Signup error:', error);

            Alert.alert(
                'Network Error',
                'Something went wrong. Please try again.'
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>

            <Text style={styles.title}>
                Take your Japanese Test
            </Text>

            <Text style={styles.subtitle}>
                Are you new? Then sign up to your account.
            </Text>

            {/* Name */}
            <Text style={styles.label}>Name</Text>

            <TextInput
                style={[
                    styles.input,
                    nameError ? styles.errorInput : null,
                ]}
                placeholder="Enter your name"
                value={name}
                onChangeText={(text) => {
                    setName(text);

                    if (text.trim()) {
                        setNameError('');
                    }
                }}
            />

            {nameError ? (
                <Text style={styles.errorText}>
                    {nameError}
                </Text>
            ) : null}

            {/* Email */}
            <Text style={styles.label}>Email</Text>

            <TextInput
                style={[
                    styles.input,
                    emailError ? styles.errorInput : null,
                ]}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                    setEmail(text);

                    if (text.trim()) {
                        setEmailError('');
                    }
                }}
            />

            {emailError ? (
                <Text style={styles.errorText}>
                    {emailError}
                </Text>
            ) : null}

            {/* Password */}
            <Text style={styles.label}>Password</Text>

            <TextInput
                style={[
                    styles.input,
                    passwordError ? styles.errorInput : null,
                ]}
                placeholder="Enter password"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                    setPassword(text);

                    if (text.trim()) {
                        setPasswordError('');
                    }
                }}
            />

            {passwordError ? (
                <Text style={styles.errorText}>
                    {passwordError}
                </Text>
            ) : null}

            {/* Confirm Password */}
            <Text style={styles.label}>Confirm Password</Text>

            <TextInput
                style={[
                    styles.input,
                    confirmPasswordError ? styles.errorInput : null,
                ]}
                placeholder="Confirm password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text) => {
                    setConfirmPassword(text);

                    if (text.trim()) {
                        setConfirmPasswordError('');
                    }
                }}
            />

            {confirmPasswordError ? (
                <Text style={styles.errorText}>
                    {confirmPasswordError}
                </Text>
            ) : null}

            {/* Signup Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleSignup}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading
                        ? 'Creating Account...'
                        : 'Sign Up'}
                </Text>
            </TouchableOpacity>

            {/* Login */}
            <Text style={styles.footerText}>
                Do you have an account?

                <Text
                    style={styles.loginText}
                    onPress={() => router.push('/login')}
                >
                    {' '}Log In
                </Text>
            </Text>

        </ScrollView>
    );
}

const styles = StyleSheet.create({

    container: {
        flexGrow: 1,
        backgroundColor: '#FFFFFF',
        padding: 24,
        justifyContent: 'center',
    },

    title: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
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
        marginBottom: 6,
    },

    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 6,
        fontSize: 14,
    },

    errorInput: {
        borderColor: 'red',
    },

    errorText: {
        color: 'red',
        marginBottom: 10,
        fontSize: 12,
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
        fontWeight: '600',
        fontSize: 16,
    },

    footerText: {
        textAlign: 'center',
        marginTop: 18,
        fontSize: 13,
        color: '#6B7280',
    },

    loginText: {
        color: colors.text,
        fontWeight: '700',
    },
});