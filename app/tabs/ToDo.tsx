import { Checkbox } from 'expo-checkbox';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  importance: number;
  points: number;
}

export default function App() {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', title: 'Faire les courses', completed: false, importance: 3, points: 10 },
    { id: '2', title: 'Appeler le médecin', completed: false, importance: 5, points: 20 },
    { id: '3', title: 'Préparer le dîner', completed: false, importance: 4, points: 15 },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newImportance, setNewImportance] = useState('3');
  const [newPoints, setNewPoints] = useState('10');

  const addTodo = () => {
    if (newTitle.trim() === '') return;

    const importance = parseInt(newImportance) || 1;
    const points = parseInt(newPoints) || 0;

    if (importance < 1 || importance > 5) {
      alert('Le niveau d\'importance doit être entre 1 et 5');
      return;
    }

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      completed: false,
      importance: importance,
      points: points,
    };

    setTodos([...todos, newTodo]);
    setNewTitle('');
    setNewImportance('3');
    setNewPoints('10');
  };

  const toggleTodo = (id: string) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const getImportanceColor = (importance: number) => {
    const colors = ['#90EE90', '#FFD700', '#FFA500', '#FF6347', '#FF0000'];
    return colors[importance - 1] || '#FFD700';
  };

  const renderItem = ({ item }: { item: TodoItem }) => (
    <View style={styles.section}>
      <Checkbox
        style={styles.checkbox}
        value={item.completed}
        onValueChange={() => toggleTodo(item.id)}
        color={item.completed ? '#ffbf00' : undefined}
      />
      <View style={styles.taskInfo}>
        <Text
          style={[
            styles.paragraph,
            item.completed && styles.completedText,
          ]}
        >
          {item.title}
        </Text>
        <View style={styles.metadata}>
          <View style={[styles.importanceBadge, { backgroundColor: getImportanceColor(item.importance) }]}>
            <Text style={styles.badgeText}>Priorité {item.importance}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>🏆 {item.points} pts</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Tâches</Text>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nouvelle tâche..."
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Importance (1-5)</Text>
            <TextInput
              style={styles.smallInput}
              placeholder="Niveau d'importance (1-5)"
              value={newImportance}
              onChangeText={setNewImportance}
              keyboardType="numeric"
              maxLength={1}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Points</Text>
            <TextInput
              style={styles.smallInput}
              placeholder="Points attribués"
              value={newPoints}
              onChangeText={setNewPoints}
              keyboardType="numeric"
            />
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ffbf00',
  },
  formContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontWeight: '600',
  },
  smallInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#ffbf00',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskInfo: {
    flex: 1,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 5,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#b0b0b0',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  checkbox: {
    margin: 8,
  },
});