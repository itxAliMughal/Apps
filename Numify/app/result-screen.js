import { FontAwesome, Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResultScreen() {
  const router = useRouter();
  const { text, timestamp } = useLocalSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Generate random color for avatar
  const getRandomColor = () => {
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#F333FF",
      "#33FFF5",
      "#FF33A8",
      "#A833FF",
      "#33FFBD",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Extract all contact info from text
  const extractAllContacts = (text) => {
    if (!text) return [];

    const phoneRegex =
      /(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{1,4}\)[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    const phoneMatches = text.match(phoneRegex) || [];

    // Split text into lines
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    const contacts = [];
    let currentName = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const phoneInLine = line.match(phoneRegex);

      if (phoneInLine) {
        // If line contains phone number, check if previous line was a name
        const name =
          i > 0 && !lines[i - 1].match(phoneRegex) ? lines[i - 1] : "";
        contacts.push({
          name: name.trim(),
          phone: phoneInLine[0].replace(/\D/g, ""),
          color: getRandomColor(),
          letter: name.trim().charAt(0).toUpperCase() || "?",
        });
      } else if (i === lines.length - 1 || !lines[i + 1].match(phoneRegex)) {
        // If line doesn't contain phone and next line doesn't either, treat as standalone name
        currentName = line.trim();
      }
    }

    // If we have phone numbers but couldn't pair names, use default name
    if (phoneMatches.length > 0 && contacts.length === 0) {
      return phoneMatches.map((phone) => ({
        name: "Unknown",
        phone: phone.replace(/\D/g, ""),
        color: getRandomColor(),
        letter: "?",
      }));
    }

    return contacts;
  };

  useEffect(() => {
    const extractedContacts = extractAllContacts(text);
    setContacts(extractedContacts);
    if (extractedContacts.length > 0) {
      setEditedName(extractedContacts[0].name);
      setEditedPhone(extractedContacts[0].phone);
    }
  }, [timestamp]);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  // WhatsApp chat open function
  const openWhatsApp = (phone) => {
    if (!phone || phone.length < 7) {
      Alert.alert("Error", "Valid phone number is required");
      return;
    }
    const url = `whatsapp://send?phone=${phone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert("Error", "WhatsApp is not installed");
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => Alert.alert("Error", err.message));
  };

  // Call function
  const makeCall = (phone) => {
    if (!phone || phone.length < 7) {
      Alert.alert("Error", "Valid phone number is required");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  // Save contact function
  const saveContact = async (name, phone) => {
    if (!phone || phone.length < 7) {
      Alert.alert("Error", "Valid phone number is required");
      return;
    }

    setIsSaving(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Contacts permission denied");
      }

      const contact = {
        [Contacts.Fields.FirstName]: name || "Unknown",
        [Contacts.Fields.PhoneNumbers]: [
          {
            label: "mobile",
            number: phone,
          },
        ],
      };

      await Contacts.addContactAsync(contact);
      Alert.alert("Success", "Contact saved successfully");
    } catch (error) {
      Alert.alert("Save Error", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = (index) => {
    if (isEditing && editingIndex === index) {
      // Save edits
      const updatedContacts = [...contacts];
      updatedContacts[index] = {
        ...updatedContacts[index],
        name: editedName,
        phone: editedPhone,
        letter: editedName.charAt(0).toUpperCase() || "?",
      };
      setContacts(updatedContacts);
      setIsEditing(false);
      setEditingIndex(null);
    } else {
      // Start editing
      setIsEditing(true);
      setEditingIndex(index);
      setEditedName(contacts[index].name);
      setEditedPhone(contacts[index].phone);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Header - keep as is */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>Numify</Text>
        <Text style={styles.headerTitle}>Contacts</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar - keep as is */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredContacts.length === 0 ? (
          <Text style={styles.noContacts}>No contacts found</Text>
        ) : (
          filteredContacts.map((contact, index) => (
            <View key={index} style={styles.contactCard}>
              <View style={styles.contactTopSection}>
                <View
                  style={[styles.avatar, { backgroundColor: contact.color }]}
                >
                  <Text style={styles.avatarText}>{contact.letter}</Text>
                </View>

                <View style={styles.contactInfo}>
                  {isEditing && editingIndex === index ? (
                    <>
                      <TextInput
                        style={styles.editInput}
                        value={editedName}
                        onChangeText={setEditedName}
                        placeholder="Enter name"
                      />
                      <TextInput
                        style={styles.editInput}
                        value={editedPhone}
                        onChangeText={setEditedPhone}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                      />
                    </>
                  ) : (
                    <>
                      <Text
                        style={styles.name}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {contact.name || "No name detected"}
                      </Text>
                      <Text style={styles.phone}>
                        {contact.phone || "No phone number detected"}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openWhatsApp(contact.phone)}
                  disabled={!contact.phone}
                >
                  <FontAwesome name="whatsapp" size={20} color="#25D366" />
                  <Text style={styles.actionText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => makeCall(contact.phone)}
                  disabled={!contact.phone}
                >
                  <Ionicons name="call" size={20} color="#007AFF" />
                  <Text style={styles.actionText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => saveContact(contact.name, contact.phone)}
                  disabled={!contact.phone || isSaving}
                >
                  {isSaving && editingIndex === index ? (
                    <ActivityIndicator color="#34C759" size="small" />
                  ) : (
                    <>
                      <Ionicons name="person-add" size={20} color="#34C759" />
                      <Text style={styles.actionText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleEdit(index)}
                >
                  <Ionicons
                    name={
                      isEditing && editingIndex === index
                        ? "checkmark"
                        : "create"
                    }
                    size={20}
                    color="#5856D6"
                  />
                  <Text style={styles.actionText}>
                    {isEditing && editingIndex === index ? "Save" : "Edit"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Scan Again Button - keep as is */}
      <TouchableOpacity
        style={styles.scanAgainButton}
        onPress={() => router.push("/camera-screen")}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  headerTitle: {
    position: "absolute",
    left: 8,
    right: 0,
    bottom: 15,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  contactCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactTopSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  contactInfo: {
    flex: 1,
  },
  contactActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  phone: {
    fontSize: 15,
    color: "#666",
  },
  noContacts: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 20,
  },
  editInput: {
    fontSize: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: "#FAFAFA",
  },
  actionButton: {
    alignItems: "center",
    padding: 8,
    flex: 1,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  scanAgainButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
