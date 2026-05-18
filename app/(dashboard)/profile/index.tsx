import { colors } from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const LOGIN_PATH = '/users/me';

export default function ProfileScreen() {

    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [image, setImage] = useState<string | null>(null);

    // Validation Errors
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');

    // 🔹 Load profile data
    const loadProfile = async () => {

        try {

            const token =
                await SecureStore.getItemAsync('accessToken');

            const res = await fetch(
                `${API_URL}${LOGIN_PATH}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            console.log("PROFILE DATA 👉", data);

            // Update name
            setName(data.current_user?.username || '');

            // Update email
            setEmail(data.current_user?.email || '');

            // Update image with cache busting
            if (data.current_user?.profile_photo) {

                const imageUrl =
                    `${API_URL}/${data.current_user.profile_photo}?t=${Date.now()}`;

                setImage(imageUrl);

            } else {

                setImage(null);
            }

        } catch (err) {

            console.log('Profile load error:', err);
        }
    };

    // 🔹 Initial load
    useEffect(() => {
        loadProfile();
    }, []);

    // 🔹 Image Picker
    const pickImage = async () => {

        const result =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes:
                    ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.7,
            });

        if (!result.canceled) {

            setImage(result.assets[0].uri);
        }
    };

    // 🔹 Save profile
    const handleSave = async () => {

        let isValid = true;

        // Reset Errors
        setNameError('');
        setEmailError('');

        // Name Validation
        if (!name.trim()) {

            setNameError('Name is required');
            isValid = false;
        }

        // Email Validation
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email.trim()) {

            setEmailError('Email is required');
            isValid = false;

        } else if (!emailRegex.test(email)) {

            setEmailError('Enter valid email');
            isValid = false;
        }

        // Stop API call if validation fails
        if (!isValid) return;

        try {

            console.log(
                "Saving profile with name:",
                name,
                "and image:",
                image
            );

            const token =
                await SecureStore.getItemAsync('accessToken');

            const formData = new FormData();

            formData.append('username', name);

            // Upload image
            if (
                image &&
                !image.includes('profile_photo')
            ) {

                formData.append('file', {
                    uri: image,
                    type: 'image/jpeg',
                    name: 'profile.jpg',
                } as any);
            }

            const response = await fetch(
                `${API_URL}/users/profile`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            console.log("UPDATE RESPONSE 👉", data);

            // Reload latest profile instantly
            await loadProfile();

            Alert.alert(
                'Success',
                'Profile updated successfully'
            );

        } catch (error) {

            console.log(
                'Save profile error:',
                error
            );

            Alert.alert(
                'Error',
                'Failed to update profile'
            );
        }
    };

    // 🔹 Logout
    const handleLogout = async () => {

        await SecureStore.deleteItemAsync(
            'accessToken'
        );

        router.replace('/login');
    };

    return (

        <View style={styles.container}>

            {/* Profile Image */}
            <TouchableOpacity
                onPress={pickImage}
            >

                <Image
                    source={{
                        uri:
                            image ??
                            'https://i.pravatar.cc/150',
                    }}
                    style={styles.avatar}
                />

                <Text style={styles.editText}>
                    Change Photo
                </Text>

            </TouchableOpacity>

            {/* Name */}
            <Text style={styles.label}>
                Name
            </Text>

            <TextInput
                style={[
                    styles.input,
                    nameError
                        ? styles.errorInput
                        : null,
                ]}
                value={name}
                onChangeText={(text) => {

                    setName(text);

                    if (text.trim()) {
                        setNameError('');
                    }
                }}
                placeholder="Enter your name"
            />

            {nameError ? (

                <Text style={styles.errorText}>
                    {nameError}
                </Text>

            ) : null}

            {/* Email */}
            <Text style={styles.label}>
                Email
            </Text>

            <TextInput
                style={[
                    styles.input,
                    emailError
                        ? styles.errorInput
                        : null,
                ]}
                value={email}
                editable={false}
                placeholder="Enter your email"
            />

            {emailError ? (

                <Text style={styles.errorText}>
                    {emailError}
                </Text>

            ) : null}

            {/* Save Button */}
            <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
            >

                <Text style={styles.saveText}>
                    Save Changes
                </Text>

            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
                onPress={handleLogout}
            >

                <Text style={styles.logout}>
                    Logout
                </Text>

            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#fff',
    },

    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignSelf: 'center',
        marginBottom: 10,
    },

    editText: {
        textAlign: 'center',
        color: '#4F46E5',
        marginBottom: 20,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
    },

    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        marginTop: 6,
    },

    errorInput: {
        borderColor: 'red',
    },

    errorText: {
        color: 'red',
        marginTop: 4,
        fontSize: 12,
    },

    saveBtn: {
        backgroundColor: colors.btnprimary,
        padding: 14,
        borderRadius: 8,
        marginTop: 20,
    },

    saveText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
    },

    logout: {
        marginTop: 20,
        color: '#DC2626',
        textAlign: 'center',
        fontWeight: '600',
    },
});