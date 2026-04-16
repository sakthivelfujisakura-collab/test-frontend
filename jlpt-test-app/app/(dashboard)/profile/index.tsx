import { colors } from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
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
console.log("API URL:", `${API_URL}${LOGIN_PATH}`);

export default function ProfileScreen() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [image, setImage] = useState<string | null>(null);

    // 🔹 Load profile data
    const loadProfile = async () => {
        console.log("🚀 loadProfile() called");
        try {
            const token = await SecureStore.getItemAsync('accessToken');
            console.log("🔑 Token:", token);

            const res = await fetch(`${API_URL}${LOGIN_PATH}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("STATUS:", res.status);
            console.log("HEADERS:", res.headers);

            const data = await res.json();

            console.log("RAW RESPONSE DATA 👉", data);

            setName(data.current_user?.name);
            setEmail(data.current_user?.email);
            if (data.current_user?.profile_photo) {
                setImage(`${API_URL}/${data.current_user.profile_photo}`);
            } else {
                setImage(null);
            }
            console.log("IMAGE URL USED:", `${API_URL}/${data.current_user?.profile_photo}`);

        } catch (err) {
            console.log("Profile load error:", err);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    // 🔹 Image Picker
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    // 🔹 Save profile
    const handleSave = async () => {
        const token = await SecureStore.getItemAsync('accessToken');

        const formData = new FormData();
        formData.append('name', name);

        if (image) {
            formData.append('file', {
                uri: image,
                type: 'image/jpeg',
                name: 'profile.jpg',
            } as any);
        }

        await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        Alert.alert('Success', 'Profile updated successfully');
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('accessToken');
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            {/* Profile Image */}
            <TouchableOpacity onPress={pickImage}>
                <Image
                    source={{
                        uri: image ?? 'https://i.pravatar.cc/150',
                    }}
                    style={styles.avatar}
                />
                <Text style={styles.editText}>Change Photo</Text>
            </TouchableOpacity>

            {/* Name */}
            <Text style={styles.label}>Name</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
            />

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                value={email}
                editable={false}
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logout}>Logout</Text>
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