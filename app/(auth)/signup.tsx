import { colors } from '../../constants/colors';
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

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const SIGNUP_PATH = '/users/signup';

export default function SignupScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            return Alert.alert('Error', 'All fields are required');
        }

        if (password !== confirmPassword) {
            return Alert.alert('Error', 'Passwords do not match');
        }

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}${SIGNUP_PATH}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: name,
                    email,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                return Alert.alert('Error', data.detail || 'Signup failed');
            }

            Alert.alert('Success', 'Account created successfully');
            router.push('/login');
        } catch (error) {
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };


    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Top Illustration */}
            {/* <Image
        // source={require('../assets/signup.png')} // replace with your image
        style={styles.image}
      /> */}

            <Text style={styles.title}>Take your Japanese Test</Text>
            <Text style={styles.subtitle}>
                Are you new? Then sign in to your account.
            </Text>

            {/* Name */}
            <Text style={styles.label}>Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
            />

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter registered email id"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            {/* Confirm Password */}
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
                style={styles.input}
                placeholder="Confirm password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
                Do you have an account?<TouchableOpacity
                    onPress={() => router.push('/login')}>
                    <Text style={styles.loginText}> Log In</Text>
                </TouchableOpacity>
            </Text>

            {/* <Text style={styles.footerText}>
        Do you have an account? <Text style={styles.loginText}>Log In</Text>
      </Text> */}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#FFFFFF',
        padding: 24,
    },
    image: {
        width: '100%',
        height: 180,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        textAlign: 'center',
        color: '#6B7280',
        marginBottom: 20,
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
        marginBottom: 14,
        fontSize: 14,
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
        marginTop: 16,
        fontSize: 13,
        color: '#6B7280',
    },
    loginText: {
        color: colors.text,
        fontWeight: '600',
    },
});