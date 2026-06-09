import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Session } from './auth';

interface Task {
  id: string;
  title: string;
  done: boolean;
}

type Filter = 'all' | 'active' | 'done';

interface Props {
  session: Session;
  onSignOut: () => void;
}

export function TaskBoardScreen({ session, onSignOut }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState('');

  const activeCount = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);

  const visible = useMemo(() => {
    if (filter === 'active') return tasks.filter((t) => !t.done);
    if (filter === 'done') return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, filter]);

  function addTask() {
    const title = draft.trim();
    if (!title) return;
    setTasks((prev) => [{ id: `${prev.length}-${title}`, title, done: false }, ...prev]);
    setDraft('');
  }

  function toggle(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} testID="board-title">
          Mes tâches
        </Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text testID="user-email" style={styles.muted}>
            {session.email}
          </Text>
          <TouchableOpacity testID="logout-button" onPress={onSignOut}>
            <Text style={styles.link}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.newTask}>
        <TextInput
          testID="new-task-input"
          style={styles.input}
          placeholder="Ajouter une tâche…"
          placeholderTextColor="#94a3b8"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addTask}
        />
        <TouchableOpacity testID="add-task-button" style={styles.addButton} onPress={addTask}>
          <Text style={styles.buttonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {(['all', 'active', 'done'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            testID={`filter-${f}`}
            style={[styles.filter, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={filter === f ? styles.filterTextActive : styles.muted}>
              {f === 'all' ? 'Toutes' : f === 'active' ? 'À faire' : 'Terminées'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={
          <Text testID="empty-state" style={styles.muted}>
            Aucune tâche ici. 🎉
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.taskItem} testID={`task-item-${item.title}`}>
            <TouchableOpacity
              testID={`task-toggle-${item.title}`}
              onPress={() => toggle(item.id)}
              style={{ flex: 1 }}
            >
              <Text style={[styles.taskTitle, item.done && styles.taskDone]}>
                {item.done ? '☑ ' : '☐ '}
                {item.title}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity testID={`task-delete-${item.title}`} onPress={() => remove(item.id)}>
              <Text style={styles.danger}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Text testID="active-count" style={styles.muted}>
        {activeCount} tâche{activeCount > 1 ? 's' : ''} à faire
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#e2e8f0' },
  muted: { color: '#94a3b8', fontSize: 13 },
  link: { color: '#a5b4fc', fontSize: 13 },
  danger: { color: '#f87171', fontSize: 13 },
  newTask: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  input: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#e2e8f0',
  },
  addButton: { backgroundColor: '#4f46e5', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filter: { flex: 1, borderColor: '#334155', borderWidth: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  filterActive: { borderColor: '#4f46e5' },
  filterTextActive: { color: '#e2e8f0' },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0b1220',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  taskTitle: { color: '#e2e8f0' },
  taskDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
});
