import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { DrawerActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

function ProfilScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // États pour les champs modifiables
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  
  // Informations médicales
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [geneticDiseases, setGeneticDiseases] = useState('');
  const [nationalNumber, setNationalNumber] = useState('');
  
  // Médecin traitant
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorAddress, setDoctorAddress] = useState('');
  
  // École (pour les enfants)
  const [schoolName, setSchoolName] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  
  // États d'erreur
  const [nameFormatError, setNameFormatError] = useState(false);
  const [lastNameFormatError, setLastNameFormatError] = useState(false);
  const [birthDateFormatError, setBirthDateFormatError] = useState(false);

  const user = auth.currentUser;

  // Charger les données de l'utilisateur
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || '');
        setBirthDate(data.birthDate || '');
        setGender(data.gender || '');
        setPhone(data.phone || '');
        setBloodGroup(data.bloodGroup || '');
        setAllergies(data.allergies || '');
        setGeneticDiseases(data.geneticDiseases || '');
        setNationalNumber(data.nationalNumber || '');
        setDoctorName(data.doctorName || '');
        setDoctorPhone(data.doctorPhone || '');
        setDoctorAddress(data.doctorAddress || '');
        setSchoolName(data.schoolName || '');
        setSchoolPhone(data.schoolPhone || '');
        setSchoolAddress(data.schoolAddress || '');
      } else {
        // Si le document n'existe pas, créer un document vide
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger vos informations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('handleSave appelé');
    if (!user) {
      console.log('Pas d\'utilisateur connecté');
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    // Validation
    if (nameFormatError || lastNameFormatError || birthDateFormatError) {
      console.log('Erreurs de validation:', { nameFormatError, lastNameFormatError, birthDateFormatError });
      Alert.alert('Erreur', 'Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    console.log('Tentative de sauvegarde:', { firstName, lastName, birthDate });

    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate.trim(),
        gender: gender,
        phone: phone.trim(),
        bloodGroup: bloodGroup.trim(),
        allergies: allergies.trim(),
        geneticDiseases: geneticDiseases.trim(),
        nationalNumber: nationalNumber.trim(),
        doctorName: doctorName.trim(),
        doctorPhone: doctorPhone.trim(),
        doctorAddress: doctorAddress.trim(),
        schoolName: schoolName.trim(),
        schoolPhone: schoolPhone.trim(),
        schoolAddress: schoolAddress.trim(),
        updatedAt: new Date(),
      }, { merge: true });

      console.log('Sauvegarde réussie!');
      Alert.alert('Succès', 'Vos informations ont été mises à jour!');
      setIsEditing(false);
      loadUserData(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder vos modifications: ' + (error as Error).message);
    }
  };

  const handleCancel = () => {
    // Réinitialiser avec les données originales
    setFirstName(userData?.firstName || '');
    setLastName(userData?.lastName || '');
    setBirthDate(userData?.birthDate || '');
    setGender(userData?.gender || '');
    setPhone(userData?.phone || '');
    setBloodGroup(userData?.bloodGroup || '');
    setAllergies(userData?.allergies || '');
    setGeneticDiseases(userData?.geneticDiseases || '');
    setNationalNumber(userData?.nationalNumber || '');
    setDoctorName(userData?.doctorName || '');
    setDoctorPhone(userData?.doctorPhone || '');
    setDoctorAddress(userData?.doctorAddress || '');
    setSchoolName(userData?.schoolName || '');
    setSchoolPhone(userData?.schoolPhone || '');
    setSchoolAddress(userData?.schoolAddress || '');
    setIsEditing(false);
    setNameFormatError(false);
    setLastNameFormatError(false);
    setBirthDateFormatError(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Vous devez être connecté pour voir votre profil</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={80} color="#ccc" />
        <Text style={styles.title}>Mes données personnelles</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Prénom</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <>
              <TextInput
                style={[styles.input, nameFormatError && { borderColor: 'red' }]}
                value={firstName}
                maxLength={50}
                onChangeText={(text) => {
                  const filteredText = text.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '');
                  if (text !== filteredText) {
                    setNameFormatError(true);
                  } else {
                    setNameFormatError(false);
                  }
                  setFirstName(filteredText);
                }}
              />
              {nameFormatError && (
                <Text style={styles.errorText}>Seules les lettres et accents sont autorisés</Text>
              )}
            </>
          ) : (
            <Text style={styles.value}>{firstName || 'Non renseigné'}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Nom</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <>
              <TextInput
                style={[styles.input, lastNameFormatError && { borderColor: 'red' }]}
                value={lastName}
                maxLength={50}
                onChangeText={(text) => {
                  const filteredText = text.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '');
                  if (text !== filteredText) {
                    setLastNameFormatError(true);
                  } else {
                    setLastNameFormatError(false);
                  }
                  setLastName(filteredText);
                }}
              />
              {lastNameFormatError && (
                <Text style={styles.errorText}>Seules les lettres et accents sont autorisés</Text>
              )}
            </>
          ) : (
            <Text style={styles.value}>{lastName || 'Non renseigné'}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Email</Text>
          <Text style={[styles.value, { color: '#666' }]}>{email}</Text>
          {isEditing && (
            <Text style={styles.infoText}>L'email ne peut pas être modifié</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Genre</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gender}
                onValueChange={(value) => setGender(value)}
                style={styles.picker}
              >
                <Picker.Item label="Non spécifié" value="" />
                <Picker.Item label="Homme" value="homme" />
                <Picker.Item label="Femme" value="femme" />
                <Picker.Item label="Autre" value="autre" />
              </Picker>
            </View>
          ) : (
            <Text style={styles.value}>
              {gender === 'homme' ? 'Homme' : gender === 'femme' ? 'Femme' : gender === 'autre' ? 'Autre' : 'Non spécifié'}
            </Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Date de naissance</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <>
              <TextInput
                style={[styles.input, birthDateFormatError && { borderColor: 'red' }]}
                value={birthDate}
                placeholder="JJ/MM/AAAA"
                keyboardType="numeric"
                maxLength={10}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '');
                  let formatted = digits;

                  if (digits.length > 2 && digits.length <= 4) {
                    formatted = digits.slice(0, 2) + '/' + digits.slice(2);
                  } else if (digits.length > 4) {
                    formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
                  }

                  setBirthDate(formatted);

                  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
                  if (formatted.length > 0 && formatted.length < 10) {
                    setBirthDateFormatError(true);
                  } else if (formatted.length === 10 && !dateRegex.test(formatted)) {
                    setBirthDateFormatError(true);
                  } else if (formatted.length === 10 && dateRegex.test(formatted)) {
                    setBirthDateFormatError(false);
                  } else if (formatted.length === 0) {
                    setBirthDateFormatError(false);
                  }
                }}
              />
              {birthDateFormatError && (
                <Text style={styles.errorText}>Format attendu: JJ/MM/AAAA</Text>
              )}
            </>
          ) : (
            <Text style={styles.value}>{birthDate || 'Non renseignée'}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Téléphone</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={phone}
              placeholder="+32 XXX XX XX XX"
              keyboardType="phone-pad"
              onChangeText={setPhone}
            />
          ) : (
            <Text style={styles.value}>{phone || 'Non renseigné'}</Text>
          )}
        </View>
      </View>

      {/* Section Informations médicales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Informations médicales</Text>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Groupe sanguin</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={bloodGroup}
                onValueChange={setBloodGroup}
                style={styles.picker}
              >
                <Picker.Item label="Non renseigné" value="" />
                <Picker.Item label="A+" value="A+" />
                <Picker.Item label="A-" value="A-" />
                <Picker.Item label="B+" value="B+" />
                <Picker.Item label="B-" value="B-" />
                <Picker.Item label="AB+" value="AB+" />
                <Picker.Item label="AB-" value="AB-" />
                <Picker.Item label="O+" value="O+" />
                <Picker.Item label="O-" value="O-" />
              </Picker>
            </View>
          ) : (
            <Text style={styles.value}>{bloodGroup || 'Non renseigné'}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Allergies</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={allergies}
              placeholder="Séparer par des virgules"
              multiline
              onChangeText={setAllergies}
            />
          ) : (
            <Text style={styles.value}>{allergies || 'Aucune'}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Maladies génétiques</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={geneticDiseases}
              placeholder="Séparer par des virgules"
              multiline
              onChangeText={setGeneticDiseases}
            />
          ) : (
            <Text style={styles.value}>{geneticDiseases || 'Aucune'}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Numéro national</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={nationalNumber}
              placeholder="XX.XX.XX-XXX.XX"
              keyboardType="numeric"
              onChangeText={setNationalNumber}
            />
          ) : (
            <Text style={styles.value}>{nationalNumber || 'Non renseigné'}</Text>
          )}
        </View>
      </View>

      {/* Section Médecin traitant */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚕️ Médecin traitant</Text>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Nom du médecin</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={doctorName}
              placeholder="Dr. Dupont"
              onChangeText={setDoctorName}
            />
          ) : (
            <Text style={styles.value}>{doctorName || 'Non renseigné'}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Téléphone du médecin</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={doctorPhone}
              placeholder="+32 XXX XX XX XX"
              keyboardType="phone-pad"
              onChangeText={setDoctorPhone}
            />
          ) : (
            <Text style={styles.value}>{doctorPhone || 'Non renseigné'}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Adresse du cabinet</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={doctorAddress}
              placeholder="Rue, Ville, Code postal"
              multiline
              onChangeText={setDoctorAddress}
            />
          ) : (
            <Text style={styles.value}>{doctorAddress || 'Non renseignée'}</Text>
          )}
        </View>
      </View>

      {/* Section École */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏫 École</Text>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Nom de l'école</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={schoolName}
              placeholder="École primaire..."
              onChangeText={setSchoolName}
            />
          ) : (
            <Text style={styles.value}>{schoolName || 'Non renseignée'}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Téléphone de l'école</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={schoolPhone}
              placeholder="+32 XXX XX XX XX"
              keyboardType="phone-pad"
              onChangeText={setSchoolPhone}
            />
          ) : (
            <Text style={styles.value}>{schoolPhone || 'Non renseigné'}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Adresse de l'école</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={schoolAddress}
              placeholder="Rue, Ville, Code postal"
              multiline
              onChangeText={setSchoolAddress}
            />
          ) : (
            <Text style={styles.value}>{schoolAddress || 'Non renseignée'}</Text>
          )}
        </View>
      </View>

      {/* Section Compte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Compte</Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Compte créé le</Text>
          <Text style={styles.value}>
            {userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : 'Non disponible'}
          </Text>
        </View>
      </View>

      {isEditing && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.buttonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
// rajouter drawer
const Stack = createNativeStackNavigator();
export default function Profil() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfilMain"
        component={ProfilScreen}
        options={({ navigation }) => ({
          headerTitle: "Mon Profil",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: "Shrikhand_400Regular", 
            fontSize: 28,
            color: "#FF8C42",
            // fontWeight: 'bold' // Tu peux laisser, mais Shrikhand est déjà gras par défaut
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={40} style={{ marginLeft: 15, color:"#6DDB31" }} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  title: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#000',
  },
  section: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 13,
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 10,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FF8C42",
  },
  sectionTitle: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 18,
    fontWeight: '700',
    color: '#FF8C42',
    marginBottom: 15,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
    color: "#ccc"
  },
  label: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  value: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 13,
    color: '#333',
    paddingVertical: 8,
    backgroundColor: "#f5f5f5ff",
    borderRadius: 10,
    paddingLeft: 10,
  },
  input: {
    fontFamily: "Montserrat_400Regular",
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: 'white',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontFamily: "Montserrat_400Regular",
    color: '#F64040',
    fontSize: 12,
    marginTop: 5,
  },
  infoText: {
    fontFamily: "Montserrat_400Regular",
    color: '#999',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    maxWidth: 200,
  },
  saveButton: {
    backgroundColor: '#6DDB31',
  },
  cancelButton: {
    backgroundColor: '#F64040',
  },
  buttonText: {
    fontFamily: "Montserrat_400Regular",
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});