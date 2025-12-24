import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Demander la permission pour les notifications
export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permission de notification refusée');
      return false;
    }
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    return false;
  }
}

// Planifier une notification pour une tâche
export async function scheduleTaskNotification(
  taskTitle: string,
  taskDate: string, // Format: "DD/MM/YYYY"
  taskTime: string, // Format: "HH:MM"
  minutesBefore: number // 5, 10, 15, 60, 120, ou 1440 (24h)
): Promise<string | null> {
  try {
    // Convertir la date et l'heure en objet Date
    const [day, month, year] = taskDate.split('/').map(Number);
    const [hours, minutes] = taskTime.split(':').map(Number);
    
    const taskDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Calculer la date de notification (X minutes avant)
    const notificationTime = new Date(taskDateTime.getTime() - minutesBefore * 60 * 1000);
    
    // Vérifier que la notification est dans le futur
    if (notificationTime <= new Date()) {
      console.log('La date de notification est dans le passé, notification ignorée');
      return null;
    }
    
    const timeLabel = minutesBefore < 60 ? minutesBefore + ' min' : minutesBefore === 60 ? '1h' : minutesBefore === 120 ? '2h' : '1 jour';
    
    // Planifier la notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Rappel de tâche',
        body: `${taskTitle} - Dans ${timeLabel}`,
        data: { taskTitle, taskDate, taskTime },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.floor((notificationTime.getTime() - Date.now()) / 1000),
      },
    });
    
    console.log(`✅ Notification planifiée (ID: ${notificationId}) pour ${notificationTime.toLocaleString()}`);
    return notificationId;
  } catch (error) {
    console.error('Erreur lors de la planification de la notification:', error);
    return null;
  }
}

// Annuler une notification
export async function cancelNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`🗑️ Notification annulée (ID: ${notificationId})`);
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la notification:', error);
  }
}

// Annuler toutes les notifications
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ Toutes les notifications ont été annulées');
  } catch (error) {
    console.error('Erreur lors de l\'annulation de toutes les notifications:', error);
  }
}

// Obtenir le nombre de minutes à partir du label
export function getMinutesFromLabel(label: string): number {
  switch (label) {
    case '5 min avant': return 5;
    case '10 min avant': return 10;
    case '15 min avant': return 15;
    case '1 heure avant': return 60;
    case '2 heures avant': return 120;
    case '1 jour avant': return 1440;
    default: return 0;
  }
}
